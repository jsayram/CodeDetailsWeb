/**
 * Cost Estimator
 * Estimates LLM API costs for tutorial generation based on repo size
 * 
 * Pure functions - no side effects, all dependencies injected
 */

import type { LLMModel, LLMProvider } from '../types';
import { getProvider, getModel, LLM_PROVIDERS } from '../providers';

// ============================================================================
// Types
// ============================================================================

export interface TokenEstimate {
  inputTokens: number;
  outputTokens: number;
  breakdown: {
    fileContent: number;
    abstractionPrompts: number;
    relationshipPrompts: number;
    chapterPrompts: number;
    orderingPrompts: number;
  };
}

export interface CostEstimate {
  provider: string;
  model: string;
  tokens: TokenEstimate;
  costLow: number;       // -20% estimate
  costEstimated: number; // Base estimate
  costHigh: number;      // +20% estimate
  isFree: boolean;
  formattedCost: string;
}

export interface CacheSavings {
  tokensSaved: number;
  costSaved: number;
}

export interface PartialRegenerationSavings {
  originalCost: number;
  newCost: number;
  savings: number;
  savingsPercent: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Average tokens per character (rough estimate) */
const TOKENS_PER_CHAR = 0.25;

/** Overhead multiplier for prompt templates */
const PROMPT_OVERHEAD = 1.3;

/** Average output tokens per prompt type */
const OUTPUT_ESTIMATES = {
  abstraction: 2000,    // List of abstractions
  relationship: 1500,   // Dependency analysis
  ordering: 500,        // Chapter ordering
  chapter: 3000,        // Per chapter content
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Estimate tokens needed for a repository
 * 
 * @param fileContents - Array of file content objects
 * @param estimatedChapters - Number of chapters to generate (default: 8)
 * @returns Token estimate breakdown
 */
export function estimateTokens(
  fileContents: Array<{ path: string; content: string }>,
  estimatedChapters: number = 8
): TokenEstimate {
  // Calculate file content tokens
  const totalChars = fileContents.reduce((sum, f) => sum + f.content.length, 0);
  const fileContentTokens = Math.ceil(totalChars * TOKENS_PER_CHAR);
  
  // Input tokens for each phase
  const abstractionInputTokens = Math.ceil(fileContentTokens * PROMPT_OVERHEAD);
  const relationshipInputTokens = Math.ceil(fileContentTokens * 0.3 * PROMPT_OVERHEAD); // Uses summaries
  const orderingInputTokens = Math.ceil(2000 * PROMPT_OVERHEAD); // Fixed size prompt
  const chapterInputTokens = Math.ceil(fileContentTokens * 0.5 * PROMPT_OVERHEAD) * estimatedChapters;
  
  // Output tokens
  const abstractionOutputTokens = OUTPUT_ESTIMATES.abstraction;
  const relationshipOutputTokens = OUTPUT_ESTIMATES.relationship;
  const orderingOutputTokens = OUTPUT_ESTIMATES.ordering;
  const chapterOutputTokens = OUTPUT_ESTIMATES.chapter * estimatedChapters;
  
  const totalInputTokens = 
    abstractionInputTokens + 
    relationshipInputTokens + 
    orderingInputTokens + 
    chapterInputTokens;
    
  const totalOutputTokens = 
    abstractionOutputTokens + 
    relationshipOutputTokens + 
    orderingOutputTokens + 
    chapterOutputTokens;
  
  return {
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    breakdown: {
      fileContent: fileContentTokens,
      abstractionPrompts: abstractionInputTokens + abstractionOutputTokens,
      relationshipPrompts: relationshipInputTokens + relationshipOutputTokens,
      chapterPrompts: chapterInputTokens + chapterOutputTokens,
      orderingPrompts: orderingInputTokens + orderingOutputTokens,
    }
  };
}

/**
 * Calculate cost for a specific model
 * 
 * @param model - LLM model configuration
 * @param tokens - Token estimate
 * @returns Cost range (low, estimated, high)
 */
export function calculateCost(
  model: LLMModel,
  tokens: TokenEstimate
): { low: number; estimated: number; high: number } {
  const inputCost = (tokens.inputTokens / 1000) * model.costPer1kInput;
  const outputCost = (tokens.outputTokens / 1000) * model.costPer1kOutput;
  const baseCost = inputCost + outputCost;
  
  return {
    low: baseCost * 0.8,
    estimated: baseCost,
    high: baseCost * 1.2
  };
}

/**
 * Format cost for display
 * 
 * @param cost - Cost range object
 * @returns Formatted cost string
 */
export function formatCost(cost: { low: number; estimated: number; high: number }): string {
  if (cost.estimated === 0) {
    return 'FREE (local)';
  }
  
  const format = (n: number) => {
    if (n < 0.01) return `$${n.toFixed(4)}`;
    if (n < 1) return `$${n.toFixed(3)}`;
    return `$${n.toFixed(2)}`;
  };
  
  return `${format(cost.low)} - ${format(cost.high)}`;
}

/**
 * Get full cost estimate for a provider/model combination
 * 
 * @param providerId - Provider identifier
 * @param modelId - Model identifier
 * @param fileContents - Array of file content objects
 * @param estimatedChapters - Number of chapters (default: 8)
 * @returns Complete cost estimate
 * @throws Error if provider/model not found
 */
export function getFullCostEstimate(
  providerId: string,
  modelId: string,
  fileContents: Array<{ path: string; content: string }>,
  estimatedChapters: number = 8
): CostEstimate {
  const provider = getProvider(providerId);
  const model = getModel(providerId, modelId);
  
  if (!provider || !model) {
    throw new Error(`Unknown provider/model: ${providerId}/${modelId}`);
  }
  
  const tokens = estimateTokens(fileContents, estimatedChapters);
  const cost = calculateCost(model, tokens);
  const isFree = model.costPer1kInput === 0 && model.costPer1kOutput === 0;
  
  return {
    provider: provider.name,
    model: model.name,
    tokens,
    costLow: cost.low,
    costEstimated: cost.estimated,
    costHigh: cost.high,
    isFree,
    formattedCost: formatCost(cost)
  };
}

/**
 * Compare costs across all providers/models
 * 
 * @param fileContents - Array of file content objects
 * @param estimatedChapters - Number of chapters (default: 8)
 * @param providers - Optional custom providers list (defaults to LLM_PROVIDERS)
 * @returns Sorted array of cost estimates (cheapest first)
 */
export function compareCosts(
  fileContents: Array<{ path: string; content: string }>,
  estimatedChapters: number = 8,
  providers: LLMProvider[] = LLM_PROVIDERS
): CostEstimate[] {
  const estimates: CostEstimate[] = [];
  
  for (const provider of providers) {
    for (const model of provider.models) {
      try {
        estimates.push(
          getFullCostEstimate(provider.id, model.id, fileContents, estimatedChapters)
        );
      } catch {
        // Skip invalid combinations
      }
    }
  }
  
  // Sort by estimated cost (cheapest first)
  return estimates.sort((a, b) => a.costEstimated - b.costEstimated);
}

/**
 * Get cost savings from cache hits
 * 
 * @param providerId - Provider identifier
 * @param modelId - Model identifier
 * @param cachedPrompts - Number of prompts served from cache
 * @param avgTokensPerPrompt - Average tokens per prompt (default: 2000)
 * @returns Savings breakdown
 */
export function calculateCacheSavings(
  providerId: string,
  modelId: string,
  cachedPrompts: number,
  avgTokensPerPrompt: number = 2000
): CacheSavings {
  const model = getModel(providerId, modelId);
  if (!model) {
    return { tokensSaved: 0, costSaved: 0 };
  }
  
  const tokensSaved = cachedPrompts * avgTokensPerPrompt;
  const costSaved = (tokensSaved / 1000) * ((model.costPer1kInput + model.costPer1kOutput) / 2);
  
  return { tokensSaved, costSaved };
}

/**
 * Estimate savings from partial regeneration
 * 
 * @param fullEstimate - Full cost estimate
 * @param chaptersToRegenerate - Number of chapters to regenerate
 * @param totalChapters - Total number of chapters
 * @param rerunAbstractions - Whether to rerun abstraction phase
 * @returns Savings breakdown
 */
export function estimatePartialRegenerationSavings(
  fullEstimate: CostEstimate,
  chaptersToRegenerate: number,
  totalChapters: number,
  rerunAbstractions: boolean
): PartialRegenerationSavings {
  // Calculate what portion of cost is from chapters
  const chapterPortion = fullEstimate.tokens.breakdown.chapterPrompts / 
    (fullEstimate.tokens.inputTokens + fullEstimate.tokens.outputTokens);
  
  const abstractionPortion = 
    (fullEstimate.tokens.breakdown.abstractionPrompts + fullEstimate.tokens.breakdown.relationshipPrompts) /
    (fullEstimate.tokens.inputTokens + fullEstimate.tokens.outputTokens);
  
  // Calculate new cost
  const chapterRatio = chaptersToRegenerate / totalChapters;
  const chapterCost = fullEstimate.costEstimated * chapterPortion * chapterRatio;
  const abstractionCost = rerunAbstractions 
    ? fullEstimate.costEstimated * abstractionPortion 
    : 0;
  const orderingCost = fullEstimate.costEstimated * 
    (fullEstimate.tokens.breakdown.orderingPrompts / (fullEstimate.tokens.inputTokens + fullEstimate.tokens.outputTokens));
  
  const newCost = chapterCost + abstractionCost + orderingCost;
  const savings = fullEstimate.costEstimated - newCost;
  
  return {
    originalCost: fullEstimate.costEstimated,
    newCost,
    savings,
    savingsPercent: (savings / fullEstimate.costEstimated) * 100
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Quick cost estimate from character count
 * Useful for fast UI updates before full calculation
 * 
 * @param totalChars - Total characters in content
 * @param model - LLM model
 * @param estimatedChapters - Number of chapters
 * @returns Estimated cost
 */
export function quickCostEstimate(
  totalChars: number,
  model: LLMModel,
  estimatedChapters: number = 8
): number {
  const inputTokens = Math.ceil(totalChars * TOKENS_PER_CHAR * PROMPT_OVERHEAD * 2.5);
  const outputTokens = (OUTPUT_ESTIMATES.abstraction + OUTPUT_ESTIMATES.relationship + 
    OUTPUT_ESTIMATES.ordering + OUTPUT_ESTIMATES.chapter * estimatedChapters);
  
  return (inputTokens / 1000) * model.costPer1kInput + 
         (outputTokens / 1000) * model.costPer1kOutput;
}

/**
 * Get the cheapest model that fits within a budget
 * 
 * @param budget - Maximum budget in dollars
 * @param fileContents - File contents to estimate
 * @param estimatedChapters - Number of chapters
 * @returns Cheapest suitable model or null if none fit
 */
export function getCheapestModelInBudget(
  budget: number,
  fileContents: Array<{ path: string; content: string }>,
  estimatedChapters: number = 8
): CostEstimate | null {
  const costs = compareCosts(fileContents, estimatedChapters);
  
  // Find first model that fits in budget (already sorted by cost)
  return costs.find(c => c.costHigh <= budget) || null;
}

/**
 * Get models grouped by price tier
 * 
 * @param fileContents - File contents to estimate
 * @param estimatedChapters - Number of chapters
 * @returns Models grouped by tier
 */
export function getModelsByPriceTier(
  fileContents: Array<{ path: string; content: string }>,
  estimatedChapters: number = 8
): {
  free: CostEstimate[];
  budget: CostEstimate[];      // < $0.10
  standard: CostEstimate[];    // $0.10 - $1.00
  premium: CostEstimate[];     // > $1.00
} {
  const costs = compareCosts(fileContents, estimatedChapters);
  
  return {
    free: costs.filter(c => c.isFree),
    budget: costs.filter(c => !c.isFree && c.costEstimated < 0.10),
    standard: costs.filter(c => c.costEstimated >= 0.10 && c.costEstimated < 1.00),
    premium: costs.filter(c => c.costEstimated >= 1.00),
  };
}
