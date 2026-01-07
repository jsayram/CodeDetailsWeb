/**
 * Multi-Provider LLM Client
 * 
 * Supports OpenAI, Anthropic, Google, Groq, DeepSeek, OpenRouter, xAI, Azure, and Ollama
 * Pure functions with per-call dependency injection for maximum flexibility.
 * 
 * Provider-specific requirements:
 * - OpenAI GPT-5/4.1/4o: max_completion_tokens (not max_tokens)
 * - OpenAI o-series: max_completion_tokens, NO temperature
 * - Anthropic: max_tokens, supports temperature
 * - Google Gemini: maxOutputTokens in generationConfig
 * - Others: OpenAI-compatible with max_tokens
 */

import { OpenAI } from 'openai';
import {
  getProvider,
  getModel,
  getProviderBaseUrl,
  getEnvVarNames,
} from './providers';
import {
  PROVIDER_IDS,
  OPENAI_MODELS,
} from './constants';
import type {
  LLMCallOptions,
  LLMCallResult,
  SelfHealingOptions,
  SelfHealingResult,
  ConnectionTestResult,
  ProviderConfig,
} from './types';
import {
  LLMError,
  parseLLMError,
  authenticationError,
} from './errors';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_MODEL = process.env.OPEN_AI_MODEL || OPENAI_MODELS.GPT_4O_MINI;

// ============================================================================
// API Key Management
// ============================================================================

/**
 * Get API key for a specific provider
 */
export function getApiKey(providerId: string, customKey?: string): string {
  console.log('[getApiKey] Starting for provider:', providerId);
  console.log('[getApiKey] Custom key provided:', customKey ? `Yes (length: ${customKey.length})` : 'No');
  
  // If a custom key is provided, use it
  if (customKey && customKey.trim()) {
    console.log('[getApiKey] Using custom API key');
    return customKey.trim();
  }
  
  // Get env var names for this provider
  const envVarNames = getEnvVarNames(providerId);
  const provider = getProvider(providerId);
  const providerName = provider?.name || providerId;
  
  console.log('[getApiKey] Provider name:', providerName);
  console.log('[getApiKey] Env var names to check:', envVarNames);
  console.log('[getApiKey] Is local provider:', provider?.isLocal);
  
  // Local providers don't need API keys
  if (provider?.isLocal) {
    console.log('[getApiKey] Local provider, no key needed');
    return '';
  }
  
  // Check all candidate env vars
  const allCandidates = [
    ...envVarNames,
    'OPENAI_API_KEY',
    'OPEN_AI_API_KEY',
    'OPENAI_KEY',
  ];
  
  console.log('[getApiKey] All env var candidates:', allCandidates);

  for (const key of allCandidates) {
    const value = process.env[key];
    console.log(`[getApiKey] Checking ${key}:`, value ? `Found (length: ${value.length}, starts with: ${value.substring(0, 8)}...)` : 'NOT FOUND');
    if (value) {
      console.log('[getApiKey] SUCCESS - Using key from:', key);
      return value;
    }
  }

  // Provide user-friendly error message
  const envVarHint = envVarNames[0] || 'OPENAI_API_KEY';
  console.log('[getApiKey] ERROR - No API key found! Expected env var:', envVarHint);
  throw authenticationError(
    providerName,
    `No API key configured for ${providerName}. ` +
    `Either enter an API key in the field above, or add ${envVarHint} to your .env.local file.`
  );
}

// ============================================================================
// Provider-Specific Callers
// ============================================================================

/**
 * Call Anthropic (Claude)
 */
async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ content: string; usage?: { inputTokens: number; outputTokens: number } }> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  
  const client = new Anthropic({ apiKey });
  
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const content = response.content[0]?.type === 'text' 
    ? response.content[0].text 
    : '';
  
  return {
    content,
    usage: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0
    }
  };
}

/**
 * Call Google (Gemini)
 */
async function callGoogle(
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ content: string; usage?: { inputTokens: number; outputTokens: number } }> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelInstance = genAI.getGenerativeModel({ 
    model,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    }
  });
  
  const result = await modelInstance.generateContent(prompt);
  const response = result.response;
  const content = response.text();
  
  const usageMetadata = response.usageMetadata;
  
  return {
    content,
    usage: {
      inputTokens: usageMetadata?.promptTokenCount || 0,
      outputTokens: usageMetadata?.candidatesTokenCount || 0
    }
  };
}

/**
 * Call OpenAI-compatible APIs (OpenAI, Groq, DeepSeek, OpenRouter, xAI, Azure, Ollama)
 */
async function callOpenAICompatible(
  apiKey: string,
  model: string,
  prompt: string,
  temperature: number,
  maxTokens: number,
  baseUrl?: string,
  extraHeaders?: Record<string, string>,
  providerId?: string
): Promise<{ content: string; usage?: { inputTokens: number; outputTokens: number } }> {
  const clientConfig: ConstructorParameters<typeof OpenAI>[0] = { apiKey };
  
  if (baseUrl) {
    clientConfig.baseURL = baseUrl;
  }
  
  if (extraHeaders) {
    clientConfig.defaultHeaders = extraHeaders;
  }
  
  const client = new OpenAI(clientConfig);
  
  // Newer OpenAI models require max_completion_tokens
  const isNewerOpenAIModel = providerId === PROVIDER_IDS.OPENAI && (
    model.startsWith('gpt-5') ||
    model.startsWith('gpt-4.1') ||
    model.startsWith('gpt-4o') ||
    model.startsWith('o1') ||
    model.startsWith('o3') ||
    model.startsWith('o4')
  );
  
  // Reasoning models don't support temperature
  const isReasoningModel = model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4');
  
  // Build request parameters
  const requestParams: Parameters<typeof client.chat.completions.create>[0] = {
    model,
    messages: [{ role: 'user', content: prompt }],
  };
  
  // Add temperature only for models that support it
  if (!isReasoningModel) {
    requestParams.temperature = temperature;
  }
  
  // Use correct token limit parameter
  if (isNewerOpenAIModel) {
    requestParams.max_completion_tokens = maxTokens;
  } else {
    requestParams.max_tokens = maxTokens;
  }
  
  const response = await client.chat.completions.create(requestParams) as OpenAI.Chat.Completions.ChatCompletion;
  
  const content = response.choices[0]?.message?.content;
  
  // Handle empty responses
  if (!content && content !== '') {
    const finishReason = response.choices?.[0]?.finish_reason;
    if (finishReason === 'content_filter') {
      throw new Error('Response was filtered by content moderation');
    } else if (finishReason === 'length') {
      throw new Error('Response was truncated due to max tokens limit');
    } else if (!response.choices || response.choices.length === 0) {
      throw new Error(`No choices returned from API. Model "${model}" may not exist or be available.`);
    }
  }
  
  return {
    content: content || '',
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0
    }
  };
}

// ============================================================================
// Cost Calculation
// ============================================================================

/**
 * Calculate cost based on provider/model and token usage
 */
function calculateCost(
  providerId: string,
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModel(providerId, modelId);
  if (!model) return 0;
  
  const inputCost = (inputTokens / 1000) * model.costPer1kInput;
  const outputCost = (outputTokens / 1000) * model.costPer1kOutput;
  
  return inputCost + outputCost;
}

// ============================================================================
// Main LLM Call Function
// ============================================================================

/**
 * Call LLM with multi-provider support
 * 
 * @example
 * ```ts
 * const response = await callLLM({
 *   prompt: 'Hello, world!',
 *   provider: 'openai',
 *   model: 'gpt-4o-mini',
 *   customApiKey: process.env.OPENAI_API_KEY,
 * });
 * ```
 */
export async function callLLM({
  prompt,
  provider: providerId = PROVIDER_IDS.OPENAI,
  model: modelId,
  temperature = 0.2,
  maxTokens = 8192,
  customApiKey,
  customBaseUrl,
}: LLMCallOptions): Promise<string> {
  console.log('[callLLM] Starting LLM call...');
  console.log('[callLLM] Provider:', providerId);
  console.log('[callLLM] Model:', modelId);
  console.log('[callLLM] Custom API Key:', customApiKey ? `Provided (length: ${customApiKey.length})` : 'Not provided');
  console.log('[callLLM] Custom Base URL:', customBaseUrl || 'Not provided');
  
  // Get provider config
  const provider = getProvider(providerId);
  if (!provider) {
    console.log('[callLLM] ERROR: Unknown provider');
    throw new LLMError(
      'LLM_PROVIDER_ERROR' as any,
      `Unknown provider: ${providerId}`,
      { provider: providerId }
    );
  }
  
  console.log('[callLLM] Provider config found:', provider.name);
  console.log('[callLLM] Requires API key:', provider.requiresApiKey);
  
  // Default to first model if not specified
  const actualModelId = modelId || provider.models[0]?.id || DEFAULT_MODEL;
  console.log('[callLLM] Actual model ID:', actualModelId);
  
  try {
    let result: { content: string; usage?: { inputTokens: number; outputTokens: number } };
    
    // Get API key (may throw if not available and required)
    console.log('[callLLM] Getting API key...');
    const apiKey = provider.requiresApiKey 
      ? getApiKey(providerId, customApiKey) 
      : customApiKey || PROVIDER_IDS.OLLAMA;
    
    console.log('[callLLM] API key obtained:', apiKey ? `Yes (length: ${apiKey.length}, starts: ${apiKey.substring(0, 10)}...)` : 'Empty (local provider)');
    
    // Get base URL
    const baseUrl = customBaseUrl || getProviderBaseUrl(providerId);
    console.log('[callLLM] Base URL:', baseUrl || 'default (OpenAI)');
    
    // Route to appropriate SDK
    console.log('[callLLM] Routing to SDK for provider:', providerId);
    switch (providerId) {
      case PROVIDER_IDS.ANTHROPIC:
        result = await callAnthropic(apiKey, actualModelId, prompt, temperature, maxTokens);
        break;
        
      case PROVIDER_IDS.GOOGLE:
        result = await callGoogle(apiKey, actualModelId, prompt, temperature, maxTokens);
        break;
        
      case PROVIDER_IDS.OPENROUTER:
        result = await callOpenAICompatible(
          apiKey, 
          actualModelId, 
          prompt, 
          temperature, 
          maxTokens, 
          baseUrl,
          {
            'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
            'X-Title': 'CodeDetails LLM'
          },
          providerId
        );
        break;
        
      case PROVIDER_IDS.AZURE:
        const azureBaseUrl = customBaseUrl || process.env.AZURE_OPENAI_ENDPOINT;
        if (!azureBaseUrl) {
          throw authenticationError(
            'Azure OpenAI',
            'Azure OpenAI is not configured. Please set AZURE_OPENAI_ENDPOINT in your .env.local file.'
          );
        }
        result = await callOpenAICompatible(
          apiKey, 
          actualModelId, 
          prompt, 
          temperature, 
          maxTokens, 
          `${azureBaseUrl}/openai/deployments/${actualModelId}`,
          { 'api-key': apiKey },
          providerId
        );
        break;
        
      default:
        // OpenAI, Groq, DeepSeek, xAI, Ollama - all use OpenAI SDK
        result = await callOpenAICompatible(
          apiKey, 
          actualModelId, 
          prompt, 
          temperature, 
          maxTokens, 
          baseUrl,
          undefined,
          providerId
        );
    }
    
    if (!result.content) {
      throw new Error(
        `${providerId} API returned an empty response for model "${actualModelId}". ` +
        'This could be due to: (1) prompt too long for context window, ' +
        '(2) content moderation filtering, or (3) model unavailable.'
      );
    }
    
    return result.content;
    
  } catch (error: unknown) {
    // If already an LLMError, rethrow
    if (error instanceof LLMError) {
      throw error;
    }
    
    // Parse and convert to LLMError
    throw parseLLMError(error, providerId, actualModelId);
  }
}

/**
 * Call LLM and return full result with metadata
 */
export async function callLLMWithMetadata(options: LLMCallOptions): Promise<LLMCallResult> {
  const content = await callLLM(options);
  
  return {
    content,
    cached: false, // Cache is handled externally in this version
  };
}

// ============================================================================
// Connection Testing
// ============================================================================

/**
 * Test connection to a provider
 */
export async function testProviderConnection(config: ProviderConfig): Promise<ConnectionTestResult> {
  const start = Date.now();
  
  console.log('[testProviderConnection] Starting test...');
  console.log('[testProviderConnection] Config:', {
    providerId: config.providerId,
    modelId: config.modelId,
    apiKeyProvided: config.apiKey ? `Yes (length: ${config.apiKey.length})` : 'No',
    baseUrl: config.baseUrl || 'default'
  });
  
  try {
    console.log('[testProviderConnection] Calling callLLM...');
    const result = await callLLM({
      prompt: 'Say "OK" and nothing else.',
      provider: config.providerId,
      model: config.modelId,
      customApiKey: config.apiKey,
      customBaseUrl: config.baseUrl,
      maxTokens: 50,
      temperature: 0
    });
    
    const latencyMs = Date.now() - start;
    console.log('[testProviderConnection] SUCCESS! Response:', result);
    console.log('[testProviderConnection] Latency:', latencyMs, 'ms');
    
    if (result.toLowerCase().includes('ok')) {
      return {
        success: true,
        message: `Connected successfully to ${config.providerId}`,
        latencyMs
      };
    } else {
      return {
        success: true,
        message: `Connected but unexpected response: ${result.substring(0, 50)}`,
        latencyMs
      };
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.log('[testProviderConnection] ERROR:', err.message);
    console.log('[testProviderConnection] Full error:', err);
    return {
      success: false,
      message: err.message || 'Unknown error'
    };
  }
}

// ============================================================================
// Self-Healing LLM Call
// ============================================================================

/**
 * Estimate token count (heuristic: ~3.5 chars per token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

/**
 * Parse token limit error
 */
function parseTokenError(error: string): { isTokenError: boolean; limit?: number; requested?: number } {
  const pattern1 = /limit of (\d+) tokens.*resulted in (\d+) tokens/i;
  const pattern2 = /maximum context length is (\d+)/i;
  const pattern3 = /context_length_exceeded/i;
  
  let match = error.match(pattern1);
  if (match) {
    return { isTokenError: true, limit: parseInt(match[1], 10), requested: parseInt(match[2], 10) };
  }
  
  match = error.match(pattern2);
  if (match) {
    return { isTokenError: true, limit: parseInt(match[1], 10) };
  }
  
  if (pattern3.test(error)) {
    return { isTokenError: true };
  }
  
  return { isTokenError: false };
}

/**
 * Reduce content to fit within token limit
 */
function reduceContent(
  prompt: string, 
  currentTokens: number, 
  targetTokens: number,
  strategy: 'truncate' | 'summarize' | 'removeFiles' = 'truncate'
): string {
  if (strategy === 'truncate') {
    const targetChars = Math.floor(targetTokens * 3.5 * 0.9);
    if (prompt.length <= targetChars) return prompt;
    
    const truncated = prompt.substring(0, targetChars);
    const lastNewline = truncated.lastIndexOf('\n');
    
    return (lastNewline > targetChars * 0.8 ? truncated.substring(0, lastNewline) : truncated) +
      '\n\n[Content truncated to fit token limit]';
  }
  
  return reduceContent(prompt, currentTokens, targetTokens, 'truncate');
}

/**
 * Call LLM with automatic content reduction on token limit errors
 */
export async function callLLMWithSelfHealing({
  maxRetries = 3,
  reductionStrategy = 'truncate',
  onContentReduced,
  ...options
}: SelfHealingOptions): Promise<SelfHealingResult> {
  let currentPrompt = options.prompt;
  let attempts = 0;
  let wasReduced = false;
  const originalTokens = estimateTokens(options.prompt);
  let lastError: string | undefined;
  
  while (attempts < maxRetries) {
    attempts++;
    
    try {
      const content = await callLLM({
        ...options,
        prompt: currentPrompt,
      });
      
      return {
        content,
        attempts,
        wasReduced,
        originalTokens,
        finalTokens: estimateTokens(currentPrompt),
      };
    } catch (error) {
      const err = error as Error;
      const tokenError = parseTokenError(err.message);
      
      // Only retry if it's a token limit error
      if (!tokenError.isTokenError) {
        throw error;
      }
      
      lastError = err.message;
      
      const currentTokens = tokenError.requested || estimateTokens(currentPrompt);
      const limitTokens = tokenError.limit || currentTokens * 0.7;
      const targetTokens = Math.floor(limitTokens * 0.85);
      
      currentPrompt = reduceContent(currentPrompt, currentTokens, targetTokens, reductionStrategy);
      wasReduced = true;
      
      const reducedTokens = estimateTokens(currentPrompt);
      const reductionPercent = ((originalTokens - reducedTokens) / originalTokens) * 100;
      
      if (onContentReduced) {
        onContentReduced({
          attempt: attempts,
          originalTokens,
          reducedTokens,
          reductionPercent,
        });
      }
      
      // If we can't reduce further, give up
      if (reducedTokens > currentTokens * 0.95) {
        break;
      }
    }
  }
  
  return {
    content: '',
    attempts,
    wasReduced,
    originalTokens,
    finalTokens: estimateTokens(currentPrompt),
    error: lastError || 'Token limit exceeded after all retry attempts',
  };
}

// ============================================================================
// Re-exports
// ============================================================================

export { getApiKey as getOpenAIApiKey };
