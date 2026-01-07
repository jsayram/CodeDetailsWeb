/**
 * LLM Module
 * 
 * Portable multi-provider LLM client library
 * 
 * Features:
 * - Multi-provider support (OpenAI, Anthropic, Google, Groq, DeepSeek, OpenRouter, xAI, Azure, Ollama)
 * - Pure functions with dependency injection
 * - RFC 7807 compliant error handling
 * - Token and cost estimation
 * - Next.js route handler adapters
 * 
 * @example
 * ```ts
 * import { callLLM, PROVIDER_IDS, OPENAI_MODELS } from '@/llm';
 * 
 * const result = await callLLM(
 *   { prompt: 'Hello, world!' },
 *   { 
 *     providerId: PROVIDER_IDS.OPENAI, 
 *     modelId: OPENAI_MODELS.GPT4O_MINI,
 *     apiKey: process.env.OPENAI_API_KEY!,
 *   }
 * );
 * console.log(result);
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
  LLMRequest,
  LLMResponse,
  CallLLMOptions,
  CallLLMResult,
  ProviderConfig,
  LLMModel,
  LLMProvider,
  SelfHealingOptions,
  SelfHealingResult,
  ProblemDetail,
} from './types';

// ============================================================================
// Constants
// ============================================================================

export {
  // Provider IDs
  PROVIDER_IDS,
  
  // Model IDs by provider
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  GOOGLE_MODELS,
  GROQ_MODELS,
  DEEPSEEK_MODELS,
  XAI_MODELS,
  OPENROUTER_MODELS,
  OLLAMA_MODELS,
  AZURE_MODELS,
  
  // Model metadata
  MODEL_PRICING,
  MODEL_CONTEXT_WINDOWS,
  
  // Configuration
  ENV_KEYS,
  API_ENDPOINTS,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TIMEOUT,
  
  // Utility functions
  getModelDisplayName,
  calculateCost,
  getModelContextWindow,
  isLocalProvider,
  requiresApiKey,
  validateApiKey,
} from './constants';

// ============================================================================
// Providers
// ============================================================================

export {
  LLM_PROVIDERS,
  getProvider,
  getModel,
  getAllProviders,
  getRecommendedProviders,
  pricingPer1K,
  createModel,
} from './providers';

// ============================================================================
// Client
// ============================================================================

export {
  callLLM,
  callLLMWithMetadata,
  testProviderConnection,
  callLLMWithSelfHealing,
} from './client';

// ============================================================================
// Errors
// ============================================================================

export {
  LLMError,
  createLLMError,
  authenticationError,
  rateLimitError,
  tokenLimitError,
  providerError,
  modelNotFoundError,
  networkError,
  connectionError,
  timeoutError,
  LLM_ERROR_CODES,
} from './errors';

// ============================================================================
// Estimators
// ============================================================================

export {
  // Cost estimation
  estimateTokens,
  calculateCost as calculateModelCost,
  formatCost,
  getFullCostEstimate,
  compareCosts,
  calculateCacheSavings,
  estimatePartialRegenerationSavings,
  quickCostEstimate,
  getCheapestModelInBudget,
  getModelsByPriceTier,
  
  // Token estimation
  estimateTokenCount,
  estimateTokenCountBatch,
  getModelContextWindow as getContextWindow,
  estimateTokensWithWarning,
  estimateTokensForFiles,
  parseTokenLimitError,
  calculateContentReduction,
  suggestLargerModels,
  promptFitsModel,
  getMaxContentSize,
  truncateToTokenLimit,
  
  // Types
  type TokenEstimate,
  type CostEstimate,
  type CacheSavings,
  type PartialRegenerationSavings,
  type TokenEstimation,
  type TokenLimitConfig,
  type TokenLimitError,
  type ContentReduction,
  type ModelSuggestion,
} from './estimators';

// ============================================================================
// Adapters
// ============================================================================

export {
  // Route handler factories
  createLLMHandler,
  createSimpleLLMHandler,
  createStreamingLLMHandler,
  createCorsHandler,
  
  // Response helpers
  jsonResponse,
  problemResponse,
  errorToProblemDetail,
  
  // API key helpers
  getApiKeyFromEnv,
  createEnvApiKeyGetter,
  defaultCorsHeaders,
  
  // Types
  type NextJSAdapterOptions,
  type LLMRouteBody,
  type StreamingOptions,
} from './adapters';
