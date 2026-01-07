/**
 * Token Estimator
 * Estimates token count for prompts and provides warnings before LLM calls
 * 
 * Uses a simple heuristic: ~3.5 characters per token (English text)
 * More accurate for English, may vary for code or other languages
 * 
 * Pure functions - no side effects, all dependencies injected
 */

import { getModel, getProvider } from '../providers';
import { MODEL_CONTEXT_WINDOWS } from '../constants';

// ============================================================================
// Types
// ============================================================================

export interface TokenEstimation {
  estimatedTokens: number;
  contextWindow: number;
  availableTokens: number;
  outputReserve: number;
  percentUsed: number;
  isOverLimit: boolean;
  warningLevel: 'safe' | 'warning' | 'danger' | 'critical';
  message: string;
  recommendations: string[];
}

export interface TokenLimitConfig {
  /** Custom context window override (tokens) */
  customContextWindow?: number;
  /** Custom output token reserve */
  outputReserve?: number;
  /** Whether to use strict mode (lower thresholds) */
  strictMode?: boolean;
  /** Documentation mode - architecture uses signature extraction (~80% fewer tokens) */
  documentationMode?: 'tutorial' | 'architecture';
}

export interface TokenLimitError {
  isTokenLimitError: boolean;
  requestedTokens?: number;
  limitTokens?: number;
  message: string;
}

export interface ContentReduction {
  targetTokens: number;
  reductionPercent: number;
  filesToRemove: number;
}

export interface ModelSuggestion {
  providerId: string;
  modelId: string;
  name: string;
  contextWindow: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Average characters per token (conservative estimate for code) */
const CHARS_PER_TOKEN = 3.5;

/** Safety margin: reserve this percentage of context window for output */
const OUTPUT_RESERVE_PERCENT = 0.15;

/** Minimum output tokens to reserve */
const MIN_OUTPUT_TOKENS = 4096;

/** Architecture mode uses signature extraction which reduces tokens by ~80% */
const ARCHITECTURE_MODE_REDUCTION = 0.20;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Estimate token count from text
 * 
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  
  // Simple heuristic: chars / 3.5 (conservative for code which has more symbols)
  // This tends to slightly overestimate, which is safer
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate tokens for multiple files/strings
 * 
 * @param texts - Array of text strings
 * @returns Total estimated token count
 */
export function estimateTokenCountBatch(texts: string[]): number {
  return texts.reduce((sum, text) => sum + estimateTokenCount(text), 0);
}

/**
 * Get the context window for a model
 * 
 * @param providerId - Provider identifier
 * @param modelId - Model identifier
 * @returns Context window size in tokens
 */
export function getModelContextWindow(providerId: string, modelId: string): number {
  // First check our constants
  const windowFromConstants = MODEL_CONTEXT_WINDOWS[modelId];
  if (windowFromConstants) return windowFromConstants;
  
  // Fall back to provider config
  const model = getModel(providerId, modelId);
  return model?.contextWindow || 8192; // Conservative default
}

/**
 * Get token estimation and warnings for a prompt
 * 
 * @param prompt - Prompt text
 * @param providerId - Provider identifier
 * @param modelId - Model identifier
 * @param config - Optional configuration
 * @returns Token estimation with warnings
 */
export function estimateTokensWithWarning(
  prompt: string,
  providerId: string,
  modelId: string,
  config?: TokenLimitConfig
): TokenEstimation {
  const estimatedTokens = estimateTokenCount(prompt);
  const contextWindow = config?.customContextWindow || getModelContextWindow(providerId, modelId);
  
  // Calculate output reserve
  const outputReserve = config?.outputReserve || Math.max(
    MIN_OUTPUT_TOKENS,
    Math.floor(contextWindow * OUTPUT_RESERVE_PERCENT)
  );
  
  // Available tokens for input
  const availableTokens = contextWindow - outputReserve;
  const percentUsed = (estimatedTokens / availableTokens) * 100;
  const isOverLimit = estimatedTokens > availableTokens;
  
  // Determine warning level
  let warningLevel: TokenEstimation['warningLevel'];
  if (percentUsed > 100) {
    warningLevel = 'critical';
  } else if (percentUsed > 90) {
    warningLevel = 'danger';
  } else if (percentUsed > 75) {
    warningLevel = 'warning';
  } else {
    warningLevel = 'safe';
  }
  
  // Generate message and recommendations
  const model = getModel(providerId, modelId);
  const modelName = model?.name || modelId;
  
  let message: string;
  const recommendations: string[] = [];
  
  if (isOverLimit) {
    const overBy = estimatedTokens - availableTokens;
    message = `⚠️ Estimated ${estimatedTokens.toLocaleString()} tokens exceeds the ${modelName} limit of ${availableTokens.toLocaleString()} input tokens by ~${overBy.toLocaleString()} tokens.`;
    recommendations.push('Reduce the number of files selected');
    recommendations.push('Filter out large files or test files');
    recommendations.push('Use a model with a larger context window (e.g., Gemini with 1M+ tokens)');
    if (contextWindow < 200000) {
      recommendations.push(`Switch to a larger model - current limit is ${(contextWindow / 1000).toFixed(0)}K tokens`);
    }
  } else if (warningLevel === 'danger') {
    message = `🔶 Estimated ${estimatedTokens.toLocaleString()} tokens uses ${percentUsed.toFixed(1)}% of available context. You may hit limits during generation.`;
    recommendations.push('Consider reducing file count for more reliable results');
    recommendations.push('Large responses may be truncated');
  } else if (warningLevel === 'warning') {
    message = `📊 Estimated ${estimatedTokens.toLocaleString()} tokens (${percentUsed.toFixed(1)}% of ${modelName} context window)`;
  } else {
    message = `✅ Estimated ${estimatedTokens.toLocaleString()} tokens (${percentUsed.toFixed(1)}% of available context)`;
  }
  
  return {
    estimatedTokens,
    contextWindow,
    availableTokens,
    outputReserve,
    percentUsed,
    isOverLimit,
    warningLevel,
    message,
    recommendations,
  };
}

/**
 * Estimate tokens for files content
 * 
 * @param files - Array of files (either {path, content} or [path, content])
 * @param providerId - Provider identifier
 * @param modelId - Model identifier
 * @param config - Optional configuration
 * @returns Token estimation with file breakdown
 */
export function estimateTokensForFiles(
  files: Array<{ path: string; content: string } | [string, string]>,
  providerId: string,
  modelId: string,
  config?: TokenLimitConfig
): TokenEstimation & { 
  fileBreakdown: Array<{ path: string; tokens: number }>; 
  isArchitectureMode?: boolean;
} {
  // Normalize file format
  const normalizedFiles = files.map(f => {
    if (Array.isArray(f)) {
      return { path: f[0], content: f[1] };
    }
    return f;
  });
  
  // Calculate per-file token estimates
  const fileBreakdown = normalizedFiles.map(f => ({
    path: f.path,
    tokens: estimateTokenCount(f.content),
  }));
  
  // Sort by token count descending for recommendations
  fileBreakdown.sort((a, b) => b.tokens - a.tokens);
  
  // Combined content for total estimation
  const combinedContent = normalizedFiles.map(f => `File: ${f.path}\n${f.content}`).join('\n\n');
  
  // Get base estimation
  let baseEstimation = estimateTokensWithWarning(combinedContent, providerId, modelId, config);
  
  // Apply architecture mode reduction (signature extraction uses ~80% fewer tokens)
  const isArchitectureMode = config?.documentationMode === 'architecture';
  if (isArchitectureMode) {
    const reducedTokens = Math.ceil(baseEstimation.estimatedTokens * ARCHITECTURE_MODE_REDUCTION);
    const percentUsed = (reducedTokens / baseEstimation.availableTokens) * 100;
    const isOverLimit = reducedTokens > baseEstimation.availableTokens;
    
    // Recalculate warning level
    let warningLevel: TokenEstimation['warningLevel'];
    if (percentUsed > 100) {
      warningLevel = 'critical';
    } else if (percentUsed > 90) {
      warningLevel = 'danger';
    } else if (percentUsed > 75) {
      warningLevel = 'warning';
    } else {
      warningLevel = 'safe';
    }
    
    // Update message for architecture mode
    const model = getModel(providerId, modelId);
    const modelName = model?.name || modelId;
    let message: string;
    const recommendations: string[] = [];
    
    if (isOverLimit) {
      const overBy = reducedTokens - baseEstimation.availableTokens;
      message = `⚠️ Architecture mode: ~${reducedTokens.toLocaleString()} tokens (reduced from ${baseEstimation.estimatedTokens.toLocaleString()}) exceeds ${modelName} limit by ~${overBy.toLocaleString()} tokens.`;
      recommendations.push('Reduce the number of files selected');
      recommendations.push('Use a model with a larger context window');
    } else if (warningLevel === 'danger') {
      message = `🟠 Architecture mode: ~${reducedTokens.toLocaleString()} tokens (${percentUsed.toFixed(1)}% of context). Original: ${baseEstimation.estimatedTokens.toLocaleString()} tokens.`;
    } else if (warningLevel === 'warning') {
      message = `📊 Architecture mode: ~${reducedTokens.toLocaleString()} tokens (${percentUsed.toFixed(1)}% of context). Reduced from ${baseEstimation.estimatedTokens.toLocaleString()}.`;
    } else {
      message = `✅ Architecture mode: ~${reducedTokens.toLocaleString()} tokens (${percentUsed.toFixed(1)}% of context). ~80% reduction from full content.`;
    }
    
    baseEstimation = {
      ...baseEstimation,
      estimatedTokens: reducedTokens,
      percentUsed,
      isOverLimit,
      warningLevel,
      message,
      recommendations,
    };
  }
  
  // Add file-specific recommendations if over limit
  if (baseEstimation.isOverLimit) {
    const topFiles = fileBreakdown.slice(0, 3);
    const topFilesTokens = topFiles.reduce((sum, f) => sum + f.tokens, 0);
    
    if (topFilesTokens > baseEstimation.estimatedTokens * 0.5) {
      baseEstimation.recommendations.unshift(
        `Largest files: ${topFiles.map(f => `${f.path} (${f.tokens.toLocaleString()} tokens)`).join(', ')}`
      );
    }
  }
  
  return {
    ...baseEstimation,
    fileBreakdown,
    isArchitectureMode,
  };
}

// ============================================================================
// Error Parsing
// ============================================================================

/**
 * Parse token limit error from API response
 * 
 * @param error - Error string or Error object
 * @returns Parsed token limit error info
 */
export function parseTokenLimitError(error: string | Error): TokenLimitError {
  const errorMessage = error instanceof Error ? error.message : error;
  
  // Pattern: "Input tokens exceed the configured limit of X tokens. Your messages resulted in Y tokens."
  const pattern1 = /Input tokens exceed the configured limit of (\d+) tokens.*resulted in (\d+) tokens/i;
  // Pattern: "maximum context length is X tokens" / "Y tokens in your prompt"
  const pattern2 = /maximum context length is (\d+) tokens.*?(\d+) tokens/i;
  // Pattern: "context_length_exceeded"
  const pattern3 = /context_length_exceeded/i;
  // Pattern: "Request too large"
  const pattern4 = /request too large|payload too large/i;
  
  let match = errorMessage.match(pattern1);
  if (match) {
    return {
      isTokenLimitError: true,
      limitTokens: parseInt(match[1], 10),
      requestedTokens: parseInt(match[2], 10),
      message: `Input (${parseInt(match[2], 10).toLocaleString()} tokens) exceeds limit (${parseInt(match[1], 10).toLocaleString()} tokens)`,
    };
  }
  
  match = errorMessage.match(pattern2);
  if (match) {
    return {
      isTokenLimitError: true,
      limitTokens: parseInt(match[1], 10),
      requestedTokens: parseInt(match[2], 10),
      message: `Prompt (${parseInt(match[2], 10).toLocaleString()} tokens) exceeds context window (${parseInt(match[1], 10).toLocaleString()} tokens)`,
    };
  }
  
  if (pattern3.test(errorMessage) || pattern4.test(errorMessage)) {
    return {
      isTokenLimitError: true,
      message: 'Token limit exceeded',
    };
  }
  
  return {
    isTokenLimitError: false,
    message: errorMessage,
  };
}

// ============================================================================
// Recommendation Functions
// ============================================================================

/**
 * Calculate how much content to reduce to fit within limit
 * 
 * @param currentTokens - Current token count
 * @param limitTokens - Token limit
 * @param safetyMargin - Target percentage of limit (default: 0.9 = 90%)
 * @returns Reduction recommendations
 */
export function calculateContentReduction(
  currentTokens: number,
  limitTokens: number,
  safetyMargin: number = 0.9
): ContentReduction {
  const targetTokens = Math.floor(limitTokens * safetyMargin);
  const tokensToReduce = currentTokens - targetTokens;
  const reductionPercent = (tokensToReduce / currentTokens) * 100;
  
  // Rough estimate: assume average file is ~1000 tokens
  const avgTokensPerFile = 1000;
  const filesToRemove = Math.ceil(tokensToReduce / avgTokensPerFile);
  
  return {
    targetTokens,
    reductionPercent,
    filesToRemove,
  };
}

/**
 * Suggest alternative models with larger context windows
 * 
 * @param currentProviderId - Current provider ID
 * @param currentModelId - Current model ID
 * @param requiredTokens - Required token count
 * @returns Array of model suggestions
 */
export function suggestLargerModels(
  currentProviderId: string,
  currentModelId: string,
  requiredTokens: number
): ModelSuggestion[] {
  const suggestions: ModelSuggestion[] = [];
  
  // Check all models in constants
  for (const [modelId, contextWindow] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
    if (contextWindow >= requiredTokens && modelId !== currentModelId) {
      // Determine provider from model ID patterns
      let providerId = 'unknown';
      let providerName = 'Unknown';
      
      if (modelId.includes('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3') || modelId.startsWith('o4')) {
        providerId = 'openai';
        providerName = 'OpenAI';
      } else if (modelId.includes('claude')) {
        providerId = 'anthropic';
        providerName = 'Anthropic';
      } else if (modelId.includes('gemini')) {
        providerId = 'google';
        providerName = 'Google';
      } else if (modelId.includes('llama') || modelId.includes('mixtral') || modelId.includes('qwen')) {
        providerId = 'groq';
        providerName = 'Groq';
      } else if (modelId.includes('deepseek')) {
        providerId = 'deepseek';
        providerName = 'DeepSeek';
      } else if (modelId.includes('grok')) {
        providerId = 'xai';
        providerName = 'xAI';
      }
      
      const model = getModel(providerId, modelId);
      suggestions.push({
        providerId,
        modelId,
        name: model?.name || `${providerName} ${modelId}`,
        contextWindow,
      });
    }
  }
  
  // Sort by context window size (prefer smaller ones that still fit)
  return suggestions
    .sort((a, b) => a.contextWindow - b.contextWindow)
    .slice(0, 5); // Top 5 suggestions
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a prompt fits within a model's context window
 * 
 * @param prompt - Prompt text
 * @param providerId - Provider ID
 * @param modelId - Model ID
 * @param outputReserve - Tokens to reserve for output
 * @returns True if prompt fits
 */
export function promptFitsModel(
  prompt: string,
  providerId: string,
  modelId: string,
  outputReserve: number = MIN_OUTPUT_TOKENS
): boolean {
  const tokens = estimateTokenCount(prompt);
  const contextWindow = getModelContextWindow(providerId, modelId);
  return tokens <= (contextWindow - outputReserve);
}

/**
 * Get the maximum content size for a model
 * 
 * @param providerId - Provider ID
 * @param modelId - Model ID
 * @param outputReserve - Tokens to reserve for output
 * @returns Maximum input tokens and characters
 */
export function getMaxContentSize(
  providerId: string,
  modelId: string,
  outputReserve: number = MIN_OUTPUT_TOKENS
): { maxTokens: number; maxChars: number } {
  const contextWindow = getModelContextWindow(providerId, modelId);
  const maxTokens = contextWindow - outputReserve;
  const maxChars = Math.floor(maxTokens * CHARS_PER_TOKEN);
  
  return { maxTokens, maxChars };
}

/**
 * Truncate text to fit within token limit
 * 
 * @param text - Text to truncate
 * @param maxTokens - Maximum tokens
 * @returns Truncated text
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const currentTokens = estimateTokenCount(text);
  if (currentTokens <= maxTokens) return text;
  
  // Estimate characters to keep
  const ratio = maxTokens / currentTokens;
  const targetChars = Math.floor(text.length * ratio * 0.95); // 5% safety margin
  
  return text.slice(0, targetChars) + '\n\n[... truncated due to token limit ...]';
}
