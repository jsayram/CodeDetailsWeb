/**
 * LLM Provider Configuration
 * Defines all supported providers, their models, costs, and SDK configurations
 */

import type { LLMModel, LLMProvider, ProviderConfig } from './types';
import {
  PROVIDER_IDS,
  PROVIDER_NAMES,
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  GOOGLE_MODELS,
  GROQ_MODELS,
  DEEPSEEK_MODELS,
  OPENROUTER_MODELS,
  XAI_MODELS,
  AZURE_MODELS,
  OLLAMA_MODELS,
  ENV_KEYS,
  API_ENDPOINTS,
  MODEL_CONTEXT_WINDOWS,
  MODEL_PRICING,
  MODEL_DISPLAY_NAMES,
  RECOMMENDED_MODELS,
  type ProviderId,
} from './constants';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert pricing from per-1M to per-1K tokens
 */
export function pricingPer1K(modelId: string): { input: number; output: number } {
  const pricing = MODEL_PRICING[modelId];
  if (!pricing) return { input: 0, output: 0 };
  return {
    input: pricing.input / 1000,
    output: pricing.output / 1000,
  };
}

/**
 * Check if model is recommended for its provider
 */
function isRecommended(providerId: ProviderId, modelId: string): boolean {
  return RECOMMENDED_MODELS[providerId]?.includes(modelId) ?? false;
}

/**
 * Create a model definition
 */
export function createModel(
  providerId: ProviderId,
  modelId: string,
  description?: string
): LLMModel {
  const pricing = pricingPer1K(modelId);
  return {
    id: modelId,
    name: MODEL_DISPLAY_NAMES[modelId] || modelId,
    contextWindow: MODEL_CONTEXT_WINDOWS[modelId] || 8192,
    costPer1kInput: pricing.input,
    costPer1kOutput: pricing.output,
    recommended: isRecommended(providerId, modelId),
    description,
  };
}

// ============================================================================
// Provider Definitions
// ============================================================================

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: PROVIDER_IDS.OPENAI,
    name: PROVIDER_NAMES[PROVIDER_IDS.OPENAI],
    description: 'GPT-5, GPT-4.1, GPT-4o, o3/o4-mini models',
    requiresApiKey: true,
    envVarNames: [ENV_KEYS.OPENAI_API_KEY, 'OPENAI_KEY', 'OPENAI_API_KEY'],
    recommended: true,
    models: [
      // GPT-5 Series
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.GPT_5_1, 'Flagship model ⭐'),
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.GPT_5, 'Latest GPT-5'),
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.GPT_5_MINI, 'Fast, affordable GPT-5'),
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.GPT_5_NANO, 'Fastest, cheapest GPT-5'),
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.GPT_5_PRO, 'Smartest, most precise'),
      // GPT-4.1 Series
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.GPT_4_1, 'Fine-tunable'),
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.GPT_4_1_MINI, 'Fast fine-tunable'),
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.GPT_4_1_NANO, 'Cheap fine-tunable'),
      // GPT-4o Series
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.GPT_4O, 'Multimodal, reliable'),
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.GPT_4O_MINI, 'Fast and affordable'),
      // Reasoning
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.O3, 'Advanced reasoning ⭐'),
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.O4_MINI, 'Latest reasoning'),
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.O3_MINI, 'Reasoning model'),
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.O1, 'Advanced reasoning'),
      createModel(PROVIDER_IDS.OPENAI, OPENAI_MODELS.O1_MINI, 'Fast reasoning'),
    ]
  },
  {
    id: PROVIDER_IDS.ANTHROPIC,
    name: PROVIDER_NAMES[PROVIDER_IDS.ANTHROPIC],
    description: 'Claude 4.5 Sonnet/Haiku/Opus',
    requiresApiKey: true,
    envVarNames: [ENV_KEYS.ANTHROPIC_API_KEY, 'CLAUDE_API_KEY'],
    recommended: true,
    models: [
      // Claude 4.5 Series
      createModel(PROVIDER_IDS.ANTHROPIC, ANTHROPIC_MODELS.CLAUDE_SONNET_45, 'Best for coding & agents ⭐'),
      createModel(PROVIDER_IDS.ANTHROPIC, ANTHROPIC_MODELS.CLAUDE_HAIKU_45, 'Fast, near-frontier'),
      createModel(PROVIDER_IDS.ANTHROPIC, ANTHROPIC_MODELS.CLAUDE_OPUS_45, 'Maximum intelligence'),
      createModel(PROVIDER_IDS.ANTHROPIC, ANTHROPIC_MODELS.CLAUDE_OPUS_41, 'Specialized reasoning'),
      // Claude 3.5 Series (Legacy)
      createModel(PROVIDER_IDS.ANTHROPIC, ANTHROPIC_MODELS.CLAUDE_35_SONNET, 'Legacy Sonnet'),
      createModel(PROVIDER_IDS.ANTHROPIC, ANTHROPIC_MODELS.CLAUDE_35_HAIKU, 'Legacy Haiku'),
    ]
  },
  {
    id: PROVIDER_IDS.GOOGLE,
    name: PROVIDER_NAMES[PROVIDER_IDS.GOOGLE],
    description: 'Gemini 3 Pro, Gemini 2.5 Pro/Flash',
    requiresApiKey: true,
    envVarNames: [ENV_KEYS.GOOGLE_API_KEY, 'GEMINI_API_KEY', 'GOOGLE_AI_API_KEY'],
    recommended: true,
    models: [
      // Gemini 3 Series
      createModel(PROVIDER_IDS.GOOGLE, GOOGLE_MODELS.GEMINI_3_PRO, 'Best multimodal & agentic ⭐'),
      // Gemini 2.5 Series
      createModel(PROVIDER_IDS.GOOGLE, GOOGLE_MODELS.GEMINI_25_PRO, 'Advanced thinking'),
      createModel(PROVIDER_IDS.GOOGLE, GOOGLE_MODELS.GEMINI_25_FLASH, 'Fast hybrid reasoning'),
      createModel(PROVIDER_IDS.GOOGLE, GOOGLE_MODELS.GEMINI_25_FLASH_LITE, 'Ultra-cheap, fast'),
      // Gemini 2.0 Series
      createModel(PROVIDER_IDS.GOOGLE, GOOGLE_MODELS.GEMINI_2_FLASH, '1M context, balanced'),
      createModel(PROVIDER_IDS.GOOGLE, GOOGLE_MODELS.GEMINI_2_FLASH_LITE, 'Cheapest option'),
    ]
  },
  {
    id: PROVIDER_IDS.GROQ,
    name: PROVIDER_NAMES[PROVIDER_IDS.GROQ],
    description: 'Ultra-fast inference with GPT-OSS, Llama 4 & more',
    requiresApiKey: true,
    envVarNames: [ENV_KEYS.GROQ_API_KEY],
    baseUrl: API_ENDPOINTS.GROQ,
    recommended: true,
    models: [
      // GPT-OSS (OpenAI open-weight models)
      createModel(PROVIDER_IDS.GROQ, GROQ_MODELS.GPT_OSS_120B, 'OpenAI OSS 120B ⭐'),
      createModel(PROVIDER_IDS.GROQ, GROQ_MODELS.GPT_OSS_20B, 'OpenAI OSS 20B, ultra-fast'),
      // Llama 4 Series (Preview)
      createModel(PROVIDER_IDS.GROQ, GROQ_MODELS.LLAMA_4_MAVERICK, 'Llama 4 Maverick 17Bx128E'),
      createModel(PROVIDER_IDS.GROQ, GROQ_MODELS.LLAMA_4_SCOUT, 'Llama 4 Scout 17Bx16E'),
      // Qwen
      createModel(PROVIDER_IDS.GROQ, GROQ_MODELS.QWEN3_32B, 'Qwen3 32B, fast'),
      // Llama 3 Series (Production)
      createModel(PROVIDER_IDS.GROQ, GROQ_MODELS.LLAMA_33_70B, 'Llama 3.3 70B'),
      createModel(PROVIDER_IDS.GROQ, GROQ_MODELS.LLAMA_31_8B, 'Llama 3.1 8B, instant'),
      createModel(PROVIDER_IDS.GROQ, GROQ_MODELS.MIXTRAL_8X7B, 'Mixtral 8x7B'),
    ]
  },
  {
    id: PROVIDER_IDS.DEEPSEEK,
    name: PROVIDER_NAMES[PROVIDER_IDS.DEEPSEEK],
    description: 'DeepSeek V3.2 Chat & Reasoner',
    requiresApiKey: true,
    envVarNames: [ENV_KEYS.DEEPSEEK_API_KEY],
    baseUrl: API_ENDPOINTS.DEEPSEEK,
    recommended: true,
    models: [
      createModel(PROVIDER_IDS.DEEPSEEK, DEEPSEEK_MODELS.DEEPSEEK_CHAT, 'DeepSeek V3 - best general model'),
      createModel(PROVIDER_IDS.DEEPSEEK, DEEPSEEK_MODELS.DEEPSEEK_REASONER, 'DeepSeek R1 - advanced reasoning'),
      createModel(PROVIDER_IDS.DEEPSEEK, DEEPSEEK_MODELS.DEEPSEEK_CODER, 'Optimized for coding tasks'),
    ]
  },
  {
    id: PROVIDER_IDS.OPENROUTER,
    name: PROVIDER_NAMES[PROVIDER_IDS.OPENROUTER],
    description: 'Access many models through one API',
    requiresApiKey: true,
    envVarNames: [ENV_KEYS.OPENROUTER_API_KEY],
    baseUrl: API_ENDPOINTS.OPENROUTER,
    models: [
      createModel(PROVIDER_IDS.OPENROUTER, OPENROUTER_MODELS.CLAUDE_35_SONNET, 'Claude via OpenRouter'),
      createModel(PROVIDER_IDS.OPENROUTER, OPENROUTER_MODELS.GPT_4O, 'GPT-4o via OpenRouter'),
      createModel(PROVIDER_IDS.OPENROUTER, OPENROUTER_MODELS.LLAMA_31_405B, 'Largest open model'),
      createModel(PROVIDER_IDS.OPENROUTER, OPENROUTER_MODELS.MIXTRAL_8X7B, 'Fast MoE model'),
      createModel(PROVIDER_IDS.OPENROUTER, OPENROUTER_MODELS.CLAUDE_3_OPUS, 'Most capable Claude'),
    ]
  },
  {
    id: PROVIDER_IDS.XAI,
    name: PROVIDER_NAMES[PROVIDER_IDS.XAI],
    description: 'Grok 4, Grok 3 & more from xAI',
    requiresApiKey: true,
    envVarNames: [ENV_KEYS.XAI_API_KEY, 'GROK_API_KEY'],
    baseUrl: API_ENDPOINTS.XAI,
    recommended: true,
    models: [
      createModel(PROVIDER_IDS.XAI, XAI_MODELS.GROK_4_1_FAST, '2M context, ultra-fast, low cost ⭐'),
      createModel(PROVIDER_IDS.XAI, XAI_MODELS.GROK_4_1_FAST_NON_REASONING, '2M context, no reasoning'),
      createModel(PROVIDER_IDS.XAI, XAI_MODELS.GROK_4, 'Flagship reasoning model'),
      createModel(PROVIDER_IDS.XAI, XAI_MODELS.GROK_3, 'Enterprise-grade model'),
      createModel(PROVIDER_IDS.XAI, XAI_MODELS.GROK_3_MINI, 'Fast reasoning, low cost'),
      createModel(PROVIDER_IDS.XAI, XAI_MODELS.GROK_2, 'Previous generation'),
      createModel(PROVIDER_IDS.XAI, XAI_MODELS.GROK_BETA, 'Legacy beta model'),
    ]
  },
  {
    id: PROVIDER_IDS.AZURE,
    name: PROVIDER_NAMES[PROVIDER_IDS.AZURE],
    description: 'OpenAI models via Azure',
    requiresApiKey: true,
    envVarNames: [ENV_KEYS.AZURE_OPENAI_API_KEY],
    models: [
      createModel(PROVIDER_IDS.AZURE, AZURE_MODELS.GPT_4O, 'GPT-4o on Azure'),
      createModel(PROVIDER_IDS.AZURE, AZURE_MODELS.GPT_4, 'GPT-4 on Azure'),
      createModel(PROVIDER_IDS.AZURE, AZURE_MODELS.GPT_35_TURBO, 'GPT-3.5 on Azure'),
    ]
  },
  {
    id: PROVIDER_IDS.OLLAMA,
    name: PROVIDER_NAMES[PROVIDER_IDS.OLLAMA] + ' (Local)',
    description: 'Run models locally - FREE',
    requiresApiKey: false,
    envVarNames: [],
    baseUrl: API_ENDPOINTS.OLLAMA_DEFAULT + '/v1',
    isLocal: true,
    recommended: true,
    models: [
      // Default common Ollama models - user can also enter custom model names
      createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.LLAMA_32, 'Fast, good for most tasks'),
      createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.LLAMA_31, 'Better reasoning'),
      createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.LLAMA_3, 'Balanced performance'),
      createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.CODELLAMA, 'Optimized for code'),
      createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.MISTRAL, 'Efficient, multilingual'),
      createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.MIXTRAL, 'Mixture of experts'),
      createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.DEEPSEEK_CODER_V2, 'Excellent for coding'),
      createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.QWEN_25, 'Great multilingual support'),
      createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.PHI_3, 'Microsoft Phi-3'),
      createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.GEMMA_2, 'Google Gemma 2'),
    ]
  }
];

// ============================================================================
// Default Ollama Models
// ============================================================================

export const DEFAULT_OLLAMA_MODELS: LLMModel[] = [
  createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.LLAMA_32, 'Fast, good for most tasks'),
  createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.LLAMA_31, 'Better reasoning'),
  createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.CODELLAMA, 'Optimized for code'),
  createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.MISTRAL, 'Efficient, multilingual'),
  createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.DEEPSEEK_CODER_V2, 'Excellent for coding'),
  createModel(PROVIDER_IDS.OLLAMA, OLLAMA_MODELS.QWEN_25, 'Great multilingual support'),
];

// ============================================================================
// Provider Utility Functions
// ============================================================================

/**
 * Get provider by ID
 */
export function getProvider(providerId: string): LLMProvider | undefined {
  return LLM_PROVIDERS.find(p => p.id === providerId);
}

/**
 * Get model by provider and model ID
 */
export function getModel(providerId: string, modelId: string): LLMModel | undefined {
  const provider = getProvider(providerId);
  if (!provider) return undefined;
  return provider.models.find(m => m.id === modelId);
}

/**
 * Get all recommended providers
 */
export function getRecommendedProviders(): LLMProvider[] {
  return LLM_PROVIDERS.filter(p => p.recommended || p.isLocal);
}

/**
 * Get all providers
 */
export function getAllProviders(): LLMProvider[] {
  return LLM_PROVIDERS;
}

/**
 * Get all recommended models for a provider
 */
export function getRecommendedModels(providerId: string): LLMModel[] {
  const provider = getProvider(providerId);
  if (!provider) return [];
  return provider.models.filter(m => m.recommended);
}

/**
 * Convert Ollama API response to LLMModel format
 */
export function ollamaModelToLLMModel(ollamaModel: {
  name: string;
  modified_at?: string;
  size?: number;
  details?: {
    parameter_size?: string;
    family?: string;
  };
}): LLMModel {
  const paramSize = ollamaModel.details?.parameter_size || '';
  const family = ollamaModel.details?.family || '';
  
  return {
    id: ollamaModel.name,
    name: ollamaModel.name,
    contextWindow: 32768, // Default, varies by model
    costPer1kInput: 0,
    costPer1kOutput: 0,
    description: `${family} ${paramSize}`.trim() || 'Local model'
  };
}

/**
 * Check if a provider requires an API key
 */
export function requiresApiKey(providerId: string): boolean {
  const provider = getProvider(providerId);
  return provider?.requiresApiKey ?? true;
}

/**
 * Get base URL for a provider
 */
export function getProviderBaseUrl(providerId: string, customBaseUrl?: string): string | undefined {
  if (customBaseUrl) return customBaseUrl;
  const provider = getProvider(providerId);
  return provider?.baseUrl;
}

/**
 * Get environment variable names for a provider's API key
 */
export function getEnvVarNames(providerId: string): string[] {
  const provider = getProvider(providerId);
  return provider?.envVarNames ?? [];
}

// Re-export types and config for convenience
export type { ProviderConfig };
