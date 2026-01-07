/**
 * LLM Types
 * Core TypeScript interfaces for the LLM integration layer
 */

// ============================================================================
// Provider & Model Types
// ============================================================================

export interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  costPer1kInput: number;  // USD per 1k input tokens
  costPer1kOutput: number; // USD per 1k output tokens
  recommended?: boolean;
  description?: string;
}

export interface LLMProvider {
  id: string;
  name: string;
  description: string;
  models: LLMModel[];
  requiresApiKey: boolean;
  envVarNames: string[];  // List of env vars to check for API key
  baseUrl?: string;
  isLocal?: boolean;
  recommended?: boolean;
}

export interface ProviderConfig {
  providerId: string;
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
}

// ============================================================================
// LLM Request/Response Types
// ============================================================================

export interface LLMRequest {
  prompt: string;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  useCache?: boolean;
  customApiKey?: string;
  customBaseUrl?: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  cost?: number;
  cached: boolean;
}

export interface LLMCallOptions {
  prompt: string;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  useCache?: boolean;
  onCacheStatus?: (hit: boolean) => void;
  customApiKey?: string;
  customBaseUrl?: string;
}

export interface LLMCallResult {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  cost?: number;
  cached: boolean;
}

// ============================================================================
// Self-Healing Types
// ============================================================================

export interface SelfHealingOptions extends LLMCallOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Content reduction strategy */
  reductionStrategy?: 'truncate' | 'summarize' | 'removeFiles';
  /** Callback when content is reduced */
  onContentReduced?: (reduction: { 
    attempt: number; 
    originalTokens: number; 
    reducedTokens: number; 
    reductionPercent: number;
  }) => void;
}

export interface SelfHealingResult {
  content: string;
  attempts: number;
  wasReduced: boolean;
  originalTokens?: number;
  finalTokens?: number;
  error?: string;
}

// ============================================================================
// Connection Test Types
// ============================================================================

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheStats {
  entries: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export interface CacheEntry {
  prompt: string;
  response: string;
  metadata: {
    provider: string;
    model: string;
    tokenUsage?: {
      input: number;
      output: number;
    };
    cost?: number;
    timestamp: number;
  };
}

// ============================================================================
// Pricing Types
// ============================================================================

export interface ModelPricing {
  input: number;  // Cost per 1M input tokens
  output: number; // Cost per 1M output tokens
}

// ============================================================================
// Token Estimation Types
// ============================================================================

export interface TokenEstimate {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  exceedsLimit: boolean;
  warningMessage?: string;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  formattedCost: string;
}

// ============================================================================
// Type Aliases (for backwards compatibility)
// ============================================================================

/** @deprecated Use LLMCallOptions instead */
export type CallLLMOptions = LLMCallOptions;

/** @deprecated Use LLMCallResult instead */
export type CallLLMResult = LLMCallResult;

// ============================================================================
// RFC 7807 Problem Detail
// ============================================================================

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
  hint?: string;
  timestamp?: string;
}
