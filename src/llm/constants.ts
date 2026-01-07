/**
 * LLM Constants - Single Source of Truth
 * 
 * All provider names, model identifiers, and display names are defined here.
 * When adding a new provider or model, update this file first.
 */

// ============================================================================
// PROVIDER IDENTIFIERS
// ============================================================================

export const PROVIDER_IDS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  GROQ: 'groq',
  DEEPSEEK: 'deepseek',
  OPENROUTER: 'openrouter',
  XAI: 'xai',
  AZURE: 'azure',
  OLLAMA: 'ollama',
} as const;

export type ProviderId = typeof PROVIDER_IDS[keyof typeof PROVIDER_IDS];

// ============================================================================
// PROVIDER DISPLAY NAMES
// ============================================================================

export const PROVIDER_NAMES: Record<ProviderId, string> = {
  [PROVIDER_IDS.OPENAI]: 'OpenAI',
  [PROVIDER_IDS.ANTHROPIC]: 'Anthropic',
  [PROVIDER_IDS.GOOGLE]: 'Google AI',
  [PROVIDER_IDS.GROQ]: 'Groq',
  [PROVIDER_IDS.DEEPSEEK]: 'DeepSeek',
  [PROVIDER_IDS.OPENROUTER]: 'OpenRouter',
  [PROVIDER_IDS.XAI]: 'xAI',
  [PROVIDER_IDS.AZURE]: 'Azure OpenAI',
  [PROVIDER_IDS.OLLAMA]: 'Ollama',
};

// ============================================================================
// MODEL IDENTIFIERS BY PROVIDER
// ============================================================================

export const OPENAI_MODELS = {
  // GPT-5 Series (Flagship - Dec 2025)
  GPT_5_1: 'gpt-5.1',
  GPT_5: 'gpt-5',
  GPT_5_MINI: 'gpt-5-mini',
  GPT_5_NANO: 'gpt-5-nano',
  GPT_5_PRO: 'gpt-5-pro',
  // GPT-4.1 Series
  GPT_4_1: 'gpt-4.1',
  GPT_4_1_MINI: 'gpt-4.1-mini',
  GPT_4_1_NANO: 'gpt-4.1-nano',
  // GPT-4o Series
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  // Reasoning Models
  O3: 'o3',
  O4_MINI: 'o4-mini',
  O3_MINI: 'o3-mini',
  O1: 'o1',
  O1_MINI: 'o1-mini',
  // Legacy
  GPT_4_TURBO: 'gpt-4-turbo',
  GPT_4: 'gpt-4',
  GPT_35_TURBO: 'gpt-3.5-turbo',
} as const;

export const ANTHROPIC_MODELS = {
  // Claude 4.5 Series (Latest - Nov 2025)
  CLAUDE_SONNET_45: 'claude-sonnet-4-5',
  CLAUDE_HAIKU_45: 'claude-haiku-4-5',
  CLAUDE_OPUS_45: 'claude-opus-4-5',
  CLAUDE_OPUS_41: 'claude-opus-4-1',
  // Claude 3.5 Series (Legacy)
  CLAUDE_35_SONNET: 'claude-3-5-sonnet-20241022',
  CLAUDE_35_HAIKU: 'claude-3-5-haiku-20241022',
  // Claude 3 Series (Legacy)
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
} as const;

export const GOOGLE_MODELS = {
  // Gemini 3 Series (Latest - Nov 2025)
  GEMINI_3_PRO: 'gemini-3-pro-preview',
  // Gemini 2.5 Series
  GEMINI_25_PRO: 'gemini-2.5-pro',
  GEMINI_25_FLASH: 'gemini-2.5-flash',
  GEMINI_25_FLASH_LITE: 'gemini-2.5-flash-lite',
  // Gemini 2.0 Series
  GEMINI_2_FLASH: 'gemini-2.0-flash',
  GEMINI_2_FLASH_LITE: 'gemini-2.0-flash-lite',
  // Legacy
  GEMINI_15_PRO: 'gemini-1.5-pro',
  GEMINI_15_FLASH: 'gemini-1.5-flash',
} as const;

export const GROQ_MODELS = {
  // OpenAI GPT-OSS (New - Nov 2025)
  GPT_OSS_120B: 'openai/gpt-oss-120b',
  GPT_OSS_20B: 'openai/gpt-oss-20b',
  // Llama 4 Series (Preview)
  LLAMA_4_MAVERICK: 'meta-llama/llama-4-maverick-17b-128e-instruct',
  LLAMA_4_SCOUT: 'meta-llama/llama-4-scout-17b-16e-instruct',
  // Qwen3
  QWEN3_32B: 'qwen/qwen3-32b',
  // Llama 3 Series (Production)
  LLAMA_33_70B: 'llama-3.3-70b-versatile',
  LLAMA_31_70B: 'llama-3.1-70b-versatile',
  LLAMA_31_8B: 'llama-3.1-8b-instant',
  // Safety
  LLAMA_GUARD_4_12B: 'meta-llama/llama-guard-4-12b',
  // Legacy
  MIXTRAL_8X7B: 'mixtral-8x7b-32768',
  GEMMA2_9B: 'gemma2-9b-it',
} as const;

export const XAI_MODELS = {
  // Grok 4 Series
  GROK_4: 'grok-4',
  GROK_4_1_FAST: 'grok-4-1-fast',
  GROK_4_1_FAST_NON_REASONING: 'grok-4-1-fast-non-reasoning',
  // Grok 3 Series
  GROK_3: 'grok-3',
  GROK_3_MINI: 'grok-3-mini',
  // Grok 2 Series (legacy)
  GROK_2: 'grok-2',
  GROK_BETA: 'grok-beta',
} as const;

export const DEEPSEEK_MODELS = {
  // DeepSeek V3.2 (Dec 2025)
  DEEPSEEK_CHAT: 'deepseek-chat',
  DEEPSEEK_REASONER: 'deepseek-reasoner',
  DEEPSEEK_CODER: 'deepseek-coder',
} as const;

export const OLLAMA_MODELS = {
  LLAMA_32: 'llama3.2',
  LLAMA_31: 'llama3.1',
  LLAMA_3: 'llama3',
  MISTRAL: 'mistral',
  MIXTRAL: 'mixtral',
  CODELLAMA: 'codellama',
  DEEPSEEK_CODER_V2: 'deepseek-coder-v2:latest',
  QWEN_25: 'qwen2.5',
  PHI_3: 'phi3',
  GEMMA_2: 'gemma2',
} as const;

// OpenRouter uses models from other providers with prefixed IDs
export const OPENROUTER_MODELS = {
  CLAUDE_35_SONNET: 'anthropic/claude-3.5-sonnet',
  GPT_4O: 'openai/gpt-4o',
  GEMINI_PRO: 'google/gemini-pro',
  LLAMA_31_405B: 'meta-llama/llama-3.1-405b-instruct',
  MIXTRAL_8X7B: 'mistralai/mixtral-8x7b-instruct',
  CLAUDE_3_OPUS: 'anthropic/claude-3-opus',
} as const;

// Azure uses deployment names, these are common defaults
export const AZURE_MODELS = {
  GPT_4O: 'gpt-4o',
  GPT_4: 'gpt-4',
  GPT_35_TURBO: 'gpt-35-turbo',
} as const;

// ============================================================================
// MODEL DISPLAY NAMES
// ============================================================================

export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  // OpenAI - GPT-5 Series
  [OPENAI_MODELS.GPT_5_1]: 'GPT-5.1',
  [OPENAI_MODELS.GPT_5]: 'GPT-5',
  [OPENAI_MODELS.GPT_5_MINI]: 'GPT-5 Mini',
  [OPENAI_MODELS.GPT_5_NANO]: 'GPT-5 Nano',
  [OPENAI_MODELS.GPT_5_PRO]: 'GPT-5 Pro',
  // OpenAI - GPT-4.1 Series
  [OPENAI_MODELS.GPT_4_1]: 'GPT-4.1',
  [OPENAI_MODELS.GPT_4_1_MINI]: 'GPT-4.1 Mini',
  [OPENAI_MODELS.GPT_4_1_NANO]: 'GPT-4.1 Nano',
  // OpenAI - GPT-4o Series
  [OPENAI_MODELS.GPT_4O]: 'GPT-4o',
  [OPENAI_MODELS.GPT_4O_MINI]: 'GPT-4o Mini',
  // OpenAI - Reasoning
  [OPENAI_MODELS.O3]: 'o3',
  [OPENAI_MODELS.O4_MINI]: 'o4-mini',
  [OPENAI_MODELS.O3_MINI]: 'o3-mini',
  [OPENAI_MODELS.O1]: 'o1',
  [OPENAI_MODELS.O1_MINI]: 'o1-mini',
  // OpenAI - Legacy
  [OPENAI_MODELS.GPT_4_TURBO]: 'GPT-4 Turbo',
  [OPENAI_MODELS.GPT_4]: 'GPT-4',
  [OPENAI_MODELS.GPT_35_TURBO]: 'GPT-3.5 Turbo',
  
  // Anthropic - Claude 4.5 Series
  [ANTHROPIC_MODELS.CLAUDE_SONNET_45]: 'Claude 4.5 Sonnet',
  [ANTHROPIC_MODELS.CLAUDE_HAIKU_45]: 'Claude 4.5 Haiku',
  [ANTHROPIC_MODELS.CLAUDE_OPUS_45]: 'Claude 4.5 Opus',
  [ANTHROPIC_MODELS.CLAUDE_OPUS_41]: 'Claude 4.1 Opus',
  // Anthropic - Claude 3.5 Series
  [ANTHROPIC_MODELS.CLAUDE_35_SONNET]: 'Claude 3.5 Sonnet',
  [ANTHROPIC_MODELS.CLAUDE_35_HAIKU]: 'Claude 3.5 Haiku',
  // Anthropic - Claude 3 Series
  [ANTHROPIC_MODELS.CLAUDE_3_OPUS]: 'Claude 3 Opus',
  [ANTHROPIC_MODELS.CLAUDE_3_SONNET]: 'Claude 3 Sonnet',
  [ANTHROPIC_MODELS.CLAUDE_3_HAIKU]: 'Claude 3 Haiku',
  
  // Google - Gemini 3 Series
  [GOOGLE_MODELS.GEMINI_3_PRO]: 'Gemini 3 Pro',
  // Google - Gemini 2.5 Series
  [GOOGLE_MODELS.GEMINI_25_PRO]: 'Gemini 2.5 Pro',
  [GOOGLE_MODELS.GEMINI_25_FLASH]: 'Gemini 2.5 Flash',
  [GOOGLE_MODELS.GEMINI_25_FLASH_LITE]: 'Gemini 2.5 Flash Lite',
  // Google - Gemini 2.0 Series
  [GOOGLE_MODELS.GEMINI_2_FLASH]: 'Gemini 2.0 Flash',
  [GOOGLE_MODELS.GEMINI_2_FLASH_LITE]: 'Gemini 2.0 Flash Lite',
  // Google - Legacy
  [GOOGLE_MODELS.GEMINI_15_PRO]: 'Gemini 1.5 Pro',
  [GOOGLE_MODELS.GEMINI_15_FLASH]: 'Gemini 1.5 Flash',
  
  // Groq - GPT-OSS
  [GROQ_MODELS.GPT_OSS_120B]: 'GPT-OSS 120B',
  [GROQ_MODELS.GPT_OSS_20B]: 'GPT-OSS 20B',
  // Groq - Llama 4 Series
  [GROQ_MODELS.LLAMA_4_MAVERICK]: 'Llama 4 Maverick 17Bx128E',
  [GROQ_MODELS.LLAMA_4_SCOUT]: 'Llama 4 Scout 17Bx16E',
  // Groq - Qwen
  [GROQ_MODELS.QWEN3_32B]: 'Qwen3 32B',
  // Groq - Llama 3 Series
  [GROQ_MODELS.LLAMA_33_70B]: 'Llama 3.3 70B',
  [GROQ_MODELS.LLAMA_31_70B]: 'Llama 3.1 70B',
  [GROQ_MODELS.LLAMA_31_8B]: 'Llama 3.1 8B',
  [GROQ_MODELS.LLAMA_GUARD_4_12B]: 'Llama Guard 4 12B',
  [GROQ_MODELS.MIXTRAL_8X7B]: 'Mixtral 8x7B',
  [GROQ_MODELS.GEMMA2_9B]: 'Gemma 2 9B',
  
  // xAI
  [XAI_MODELS.GROK_4]: 'Grok 4',
  [XAI_MODELS.GROK_4_1_FAST]: 'Grok 4.1 Fast',
  [XAI_MODELS.GROK_4_1_FAST_NON_REASONING]: 'Grok 4.1 Fast (Non-Reasoning)',
  [XAI_MODELS.GROK_3]: 'Grok 3',
  [XAI_MODELS.GROK_3_MINI]: 'Grok 3 Mini',
  [XAI_MODELS.GROK_2]: 'Grok 2',
  [XAI_MODELS.GROK_BETA]: 'Grok Beta',
  
  // DeepSeek
  [DEEPSEEK_MODELS.DEEPSEEK_CHAT]: 'DeepSeek V3.2 Chat',
  [DEEPSEEK_MODELS.DEEPSEEK_REASONER]: 'DeepSeek V3.2 Reasoner',
  [DEEPSEEK_MODELS.DEEPSEEK_CODER]: 'DeepSeek Coder',
  
  // Ollama
  [OLLAMA_MODELS.LLAMA_32]: 'Llama 3.2',
  [OLLAMA_MODELS.LLAMA_31]: 'Llama 3.1',
  [OLLAMA_MODELS.LLAMA_3]: 'Llama 3',
  [OLLAMA_MODELS.MISTRAL]: 'Mistral',
  [OLLAMA_MODELS.MIXTRAL]: 'Mixtral',
  [OLLAMA_MODELS.CODELLAMA]: 'Code Llama',
  [OLLAMA_MODELS.DEEPSEEK_CODER_V2]: 'DeepSeek Coder V2',
  [OLLAMA_MODELS.QWEN_25]: 'Qwen 2.5',
  [OLLAMA_MODELS.PHI_3]: 'Phi 3',
  [OLLAMA_MODELS.GEMMA_2]: 'Gemma 2',
  
  // OpenRouter
  [OPENROUTER_MODELS.CLAUDE_35_SONNET]: 'Claude 3.5 Sonnet',
  [OPENROUTER_MODELS.GPT_4O]: 'GPT-4o',
  [OPENROUTER_MODELS.GEMINI_PRO]: 'Gemini Pro',
  [OPENROUTER_MODELS.LLAMA_31_405B]: 'Llama 3.1 405B',
  [OPENROUTER_MODELS.MIXTRAL_8X7B]: 'Mixtral 8x7B',
  [OPENROUTER_MODELS.CLAUDE_3_OPUS]: 'Claude 3 Opus',
  
  // Azure uses same IDs as OpenAI, so they share display names
  [AZURE_MODELS.GPT_35_TURBO]: 'GPT-3.5 Turbo',
};

// ============================================================================
// DEFAULT MODELS PER PROVIDER
// ============================================================================

export const DEFAULT_MODELS: Record<ProviderId, string> = {
  [PROVIDER_IDS.OPENAI]: OPENAI_MODELS.GPT_5_MINI,
  [PROVIDER_IDS.ANTHROPIC]: ANTHROPIC_MODELS.CLAUDE_SONNET_45,
  [PROVIDER_IDS.GOOGLE]: GOOGLE_MODELS.GEMINI_25_FLASH,
  [PROVIDER_IDS.GROQ]: GROQ_MODELS.GPT_OSS_120B,
  [PROVIDER_IDS.DEEPSEEK]: DEEPSEEK_MODELS.DEEPSEEK_CHAT,
  [PROVIDER_IDS.OPENROUTER]: OPENROUTER_MODELS.CLAUDE_35_SONNET,
  [PROVIDER_IDS.XAI]: XAI_MODELS.GROK_4_1_FAST,
  [PROVIDER_IDS.AZURE]: AZURE_MODELS.GPT_4O,
  [PROVIDER_IDS.OLLAMA]: OLLAMA_MODELS.LLAMA_32,
};

// ============================================================================
// RECOMMENDED MODELS (shown with badge in UI)
// ============================================================================

export const RECOMMENDED_MODELS: Record<ProviderId, string[]> = {
  [PROVIDER_IDS.OPENAI]: [OPENAI_MODELS.GPT_5_MINI, OPENAI_MODELS.GPT_5_1, OPENAI_MODELS.GPT_5, OPENAI_MODELS.GPT_4O_MINI, OPENAI_MODELS.O3],
  [PROVIDER_IDS.ANTHROPIC]: [ANTHROPIC_MODELS.CLAUDE_SONNET_45, ANTHROPIC_MODELS.CLAUDE_HAIKU_45],
  [PROVIDER_IDS.GOOGLE]: [GOOGLE_MODELS.GEMINI_25_FLASH, GOOGLE_MODELS.GEMINI_25_PRO, GOOGLE_MODELS.GEMINI_3_PRO],
  [PROVIDER_IDS.GROQ]: [GROQ_MODELS.GPT_OSS_120B, GROQ_MODELS.LLAMA_4_SCOUT, GROQ_MODELS.LLAMA_31_8B],
  [PROVIDER_IDS.DEEPSEEK]: [DEEPSEEK_MODELS.DEEPSEEK_CHAT, DEEPSEEK_MODELS.DEEPSEEK_REASONER],
  [PROVIDER_IDS.OPENROUTER]: [OPENROUTER_MODELS.CLAUDE_35_SONNET],
  [PROVIDER_IDS.XAI]: [XAI_MODELS.GROK_4_1_FAST, XAI_MODELS.GROK_4, XAI_MODELS.GROK_3_MINI],
  [PROVIDER_IDS.AZURE]: [AZURE_MODELS.GPT_4O],
  [PROVIDER_IDS.OLLAMA]: [OLLAMA_MODELS.LLAMA_32, OLLAMA_MODELS.QWEN_25],
};

// ============================================================================
// ENVIRONMENT VARIABLE NAMES
// ============================================================================

export const ENV_KEYS = {
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',
  GOOGLE_API_KEY: 'GOOGLE_API_KEY',
  GROQ_API_KEY: 'GROQ_API_KEY',
  DEEPSEEK_API_KEY: 'DEEPSEEK_API_KEY',
  OPENROUTER_API_KEY: 'OPENROUTER_API_KEY',
  XAI_API_KEY: 'XAI_API_KEY',
  AZURE_OPENAI_API_KEY: 'AZURE_OPENAI_API_KEY',
  AZURE_OPENAI_ENDPOINT: 'AZURE_OPENAI_ENDPOINT',
  OLLAMA_BASE_URL: 'OLLAMA_BASE_URL',
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  OPENAI: 'https://api.openai.com/v1',
  ANTHROPIC: 'https://api.anthropic.com',
  GOOGLE: 'https://generativelanguage.googleapis.com',
  GROQ: 'https://api.groq.com/openai/v1',
  DEEPSEEK: 'https://api.deepseek.com',
  OPENROUTER: 'https://openrouter.ai/api/v1',
  XAI: 'https://api.x.ai/v1',
  OLLAMA_DEFAULT: 'http://localhost:11434',
} as const;

// ============================================================================
// MODEL CONTEXT WINDOWS (in tokens)
// ============================================================================

export const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  // OpenAI - GPT-5 Series
  [OPENAI_MODELS.GPT_5_1]: 200000,
  [OPENAI_MODELS.GPT_5]: 200000,
  [OPENAI_MODELS.GPT_5_MINI]: 200000,
  [OPENAI_MODELS.GPT_5_NANO]: 128000,
  [OPENAI_MODELS.GPT_5_PRO]: 200000,
  // OpenAI - GPT-4.1 Series
  [OPENAI_MODELS.GPT_4_1]: 200000,
  [OPENAI_MODELS.GPT_4_1_MINI]: 200000,
  [OPENAI_MODELS.GPT_4_1_NANO]: 128000,
  // OpenAI - GPT-4o Series
  [OPENAI_MODELS.GPT_4O]: 128000,
  [OPENAI_MODELS.GPT_4O_MINI]: 128000,
  // OpenAI - Reasoning
  [OPENAI_MODELS.O3]: 200000,
  [OPENAI_MODELS.O4_MINI]: 200000,
  [OPENAI_MODELS.O3_MINI]: 200000,
  [OPENAI_MODELS.O1]: 200000,
  [OPENAI_MODELS.O1_MINI]: 128000,
  // OpenAI - Legacy
  [OPENAI_MODELS.GPT_4_TURBO]: 128000,
  [OPENAI_MODELS.GPT_4]: 8192,
  [OPENAI_MODELS.GPT_35_TURBO]: 16385,
  
  // Anthropic - Claude 4.5 Series
  [ANTHROPIC_MODELS.CLAUDE_SONNET_45]: 200000,
  [ANTHROPIC_MODELS.CLAUDE_HAIKU_45]: 200000,
  [ANTHROPIC_MODELS.CLAUDE_OPUS_45]: 200000,
  [ANTHROPIC_MODELS.CLAUDE_OPUS_41]: 200000,
  // Anthropic - Claude 3.5 Series
  [ANTHROPIC_MODELS.CLAUDE_35_SONNET]: 200000,
  [ANTHROPIC_MODELS.CLAUDE_35_HAIKU]: 200000,
  // Anthropic - Claude 3 Series
  [ANTHROPIC_MODELS.CLAUDE_3_OPUS]: 200000,
  [ANTHROPIC_MODELS.CLAUDE_3_SONNET]: 200000,
  [ANTHROPIC_MODELS.CLAUDE_3_HAIKU]: 200000,
  
  // Google - Gemini 3 Series
  [GOOGLE_MODELS.GEMINI_3_PRO]: 2000000,
  // Google - Gemini 2.5 Series
  [GOOGLE_MODELS.GEMINI_25_PRO]: 2000000,
  [GOOGLE_MODELS.GEMINI_25_FLASH]: 1000000,
  [GOOGLE_MODELS.GEMINI_25_FLASH_LITE]: 1000000,
  // Google - Gemini 2.0 Series
  [GOOGLE_MODELS.GEMINI_2_FLASH]: 1000000,
  [GOOGLE_MODELS.GEMINI_2_FLASH_LITE]: 1000000,
  // Google - Legacy
  [GOOGLE_MODELS.GEMINI_15_PRO]: 2000000,
  [GOOGLE_MODELS.GEMINI_15_FLASH]: 1000000,
  
  // Groq - GPT-OSS
  [GROQ_MODELS.GPT_OSS_120B]: 131072,
  [GROQ_MODELS.GPT_OSS_20B]: 131072,
  // Groq - Llama 4 Series
  [GROQ_MODELS.LLAMA_4_MAVERICK]: 131072,
  [GROQ_MODELS.LLAMA_4_SCOUT]: 131072,
  // Groq - Qwen
  [GROQ_MODELS.QWEN3_32B]: 131072,
  // Groq - Llama 3 Series
  [GROQ_MODELS.LLAMA_33_70B]: 131072,
  [GROQ_MODELS.LLAMA_31_70B]: 131072,
  [GROQ_MODELS.LLAMA_31_8B]: 131072,
  [GROQ_MODELS.LLAMA_GUARD_4_12B]: 131072,
  [GROQ_MODELS.MIXTRAL_8X7B]: 32768,
  [GROQ_MODELS.GEMMA2_9B]: 8192,
  
  // xAI
  [XAI_MODELS.GROK_4]: 256000,
  [XAI_MODELS.GROK_4_1_FAST]: 2000000,
  [XAI_MODELS.GROK_4_1_FAST_NON_REASONING]: 2000000,
  [XAI_MODELS.GROK_3]: 131072,
  [XAI_MODELS.GROK_3_MINI]: 131072,
  [XAI_MODELS.GROK_2]: 131072,
  [XAI_MODELS.GROK_BETA]: 131072,
  
  // DeepSeek (V3.2 - 128K context)
  [DEEPSEEK_MODELS.DEEPSEEK_CHAT]: 128000,
  [DEEPSEEK_MODELS.DEEPSEEK_REASONER]: 128000,
  [DEEPSEEK_MODELS.DEEPSEEK_CODER]: 128000,
  
  // Ollama (default estimates)
  [OLLAMA_MODELS.LLAMA_32]: 128000,
  [OLLAMA_MODELS.LLAMA_31]: 128000,
  [OLLAMA_MODELS.LLAMA_3]: 8192,
  [OLLAMA_MODELS.MISTRAL]: 32768,
  [OLLAMA_MODELS.MIXTRAL]: 32768,
  [OLLAMA_MODELS.CODELLAMA]: 16384,
  [OLLAMA_MODELS.DEEPSEEK_CODER_V2]: 16384,
  [OLLAMA_MODELS.QWEN_25]: 32768,
  [OLLAMA_MODELS.PHI_3]: 128000,
  [OLLAMA_MODELS.GEMMA_2]: 8192,
};

// ============================================================================
// PRICING (per 1M tokens) - INPUT / OUTPUT
// ============================================================================

import type { ModelPricing } from './types';

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI - GPT-5 Series (Standard pricing per 1M tokens)
  [OPENAI_MODELS.GPT_5_1]: { input: 1.25, output: 10.00 },
  [OPENAI_MODELS.GPT_5]: { input: 1.25, output: 10.00 },
  [OPENAI_MODELS.GPT_5_MINI]: { input: 0.25, output: 2.00 },
  [OPENAI_MODELS.GPT_5_NANO]: { input: 0.05, output: 0.40 },
  [OPENAI_MODELS.GPT_5_PRO]: { input: 15.00, output: 120.00 },
  // OpenAI - GPT-4.1 Series
  [OPENAI_MODELS.GPT_4_1]: { input: 3.50, output: 14.00 },
  [OPENAI_MODELS.GPT_4_1_MINI]: { input: 0.70, output: 2.80 },
  [OPENAI_MODELS.GPT_4_1_NANO]: { input: 0.20, output: 0.80 },
  // OpenAI - GPT-4o Series
  [OPENAI_MODELS.GPT_4O]: { input: 4.25, output: 17.00 },
  [OPENAI_MODELS.GPT_4O_MINI]: { input: 0.25, output: 1.00 },
  // OpenAI - Reasoning
  [OPENAI_MODELS.O3]: { input: 3.50, output: 14.00 },
  [OPENAI_MODELS.O4_MINI]: { input: 2.00, output: 8.00 },
  [OPENAI_MODELS.O3_MINI]: { input: 1.10, output: 4.40 },
  [OPENAI_MODELS.O1]: { input: 15.00, output: 60.00 },
  [OPENAI_MODELS.O1_MINI]: { input: 3.00, output: 12.00 },
  // OpenAI - Legacy
  [OPENAI_MODELS.GPT_4_TURBO]: { input: 10.00, output: 30.00 },
  [OPENAI_MODELS.GPT_4]: { input: 30.00, output: 60.00 },
  [OPENAI_MODELS.GPT_35_TURBO]: { input: 0.50, output: 1.50 },
  
  // Anthropic - Claude 4.5 Series
  [ANTHROPIC_MODELS.CLAUDE_SONNET_45]: { input: 3.00, output: 15.00 },
  [ANTHROPIC_MODELS.CLAUDE_HAIKU_45]: { input: 1.00, output: 5.00 },
  [ANTHROPIC_MODELS.CLAUDE_OPUS_45]: { input: 5.00, output: 25.00 },
  [ANTHROPIC_MODELS.CLAUDE_OPUS_41]: { input: 15.00, output: 75.00 },
  // Anthropic - Claude 3.5 Series
  [ANTHROPIC_MODELS.CLAUDE_35_SONNET]: { input: 3.00, output: 15.00 },
  [ANTHROPIC_MODELS.CLAUDE_35_HAIKU]: { input: 0.80, output: 4.00 },
  // Anthropic - Claude 3 Series
  [ANTHROPIC_MODELS.CLAUDE_3_OPUS]: { input: 15.00, output: 75.00 },
  [ANTHROPIC_MODELS.CLAUDE_3_SONNET]: { input: 3.00, output: 15.00 },
  [ANTHROPIC_MODELS.CLAUDE_3_HAIKU]: { input: 0.25, output: 1.25 },
  
  // Google - Gemini 3 Series (batch pricing)
  [GOOGLE_MODELS.GEMINI_3_PRO]: { input: 2.00, output: 12.00 },
  // Google - Gemini 2.5 Series
  [GOOGLE_MODELS.GEMINI_25_PRO]: { input: 1.25, output: 10.00 },
  [GOOGLE_MODELS.GEMINI_25_FLASH]: { input: 0.30, output: 2.50 },
  [GOOGLE_MODELS.GEMINI_25_FLASH_LITE]: { input: 0.10, output: 0.40 },
  // Google - Gemini 2.0 Series
  [GOOGLE_MODELS.GEMINI_2_FLASH]: { input: 0.10, output: 0.40 },
  [GOOGLE_MODELS.GEMINI_2_FLASH_LITE]: { input: 0.075, output: 0.30 },
  // Google - Legacy
  [GOOGLE_MODELS.GEMINI_15_PRO]: { input: 1.25, output: 5.00 },
  [GOOGLE_MODELS.GEMINI_15_FLASH]: { input: 0.075, output: 0.30 },
  
  // Groq - GPT-OSS
  [GROQ_MODELS.GPT_OSS_120B]: { input: 0.15, output: 0.60 },
  [GROQ_MODELS.GPT_OSS_20B]: { input: 0.075, output: 0.30 },
  // Groq - Llama 4 Series
  [GROQ_MODELS.LLAMA_4_MAVERICK]: { input: 0.20, output: 0.60 },
  [GROQ_MODELS.LLAMA_4_SCOUT]: { input: 0.11, output: 0.34 },
  // Groq - Qwen
  [GROQ_MODELS.QWEN3_32B]: { input: 0.29, output: 0.59 },
  // Groq - Llama 3 Series
  [GROQ_MODELS.LLAMA_33_70B]: { input: 0.59, output: 0.79 },
  [GROQ_MODELS.LLAMA_31_70B]: { input: 0.59, output: 0.79 },
  [GROQ_MODELS.LLAMA_31_8B]: { input: 0.05, output: 0.08 },
  [GROQ_MODELS.LLAMA_GUARD_4_12B]: { input: 0.20, output: 0.20 },
  [GROQ_MODELS.MIXTRAL_8X7B]: { input: 0.24, output: 0.24 },
  [GROQ_MODELS.GEMMA2_9B]: { input: 0.20, output: 0.20 },
  
  // xAI
  [XAI_MODELS.GROK_4]: { input: 3.00, output: 15.00 },
  [XAI_MODELS.GROK_4_1_FAST]: { input: 0.20, output: 0.50 },
  [XAI_MODELS.GROK_4_1_FAST_NON_REASONING]: { input: 0.20, output: 0.50 },
  [XAI_MODELS.GROK_3]: { input: 3.00, output: 15.00 },
  [XAI_MODELS.GROK_3_MINI]: { input: 0.30, output: 0.50 },
  [XAI_MODELS.GROK_2]: { input: 2.00, output: 10.00 },
  [XAI_MODELS.GROK_BETA]: { input: 5.00, output: 15.00 },
  
  // DeepSeek V3.2 (very affordable)
  [DEEPSEEK_MODELS.DEEPSEEK_CHAT]: { input: 0.28, output: 0.42 },
  [DEEPSEEK_MODELS.DEEPSEEK_REASONER]: { input: 0.28, output: 0.42 },
  [DEEPSEEK_MODELS.DEEPSEEK_CODER]: { input: 0.28, output: 0.42 },
  
  // OpenRouter (varies, showing approximate)
  [OPENROUTER_MODELS.CLAUDE_35_SONNET]: { input: 3.00, output: 15.00 },
  [OPENROUTER_MODELS.GPT_4O]: { input: 2.50, output: 10.00 },
  [OPENROUTER_MODELS.GEMINI_PRO]: { input: 0.125, output: 0.375 },
  [OPENROUTER_MODELS.LLAMA_31_405B]: { input: 2.70, output: 2.70 },
  [OPENROUTER_MODELS.MIXTRAL_8X7B]: { input: 0.24, output: 0.24 },
  [OPENROUTER_MODELS.CLAUDE_3_OPUS]: { input: 15.00, output: 75.00 },
  
  // Ollama - Free (local inference)
  [OLLAMA_MODELS.LLAMA_32]: { input: 0, output: 0 },
  [OLLAMA_MODELS.LLAMA_31]: { input: 0, output: 0 },
  [OLLAMA_MODELS.LLAMA_3]: { input: 0, output: 0 },
  [OLLAMA_MODELS.MISTRAL]: { input: 0, output: 0 },
  [OLLAMA_MODELS.MIXTRAL]: { input: 0, output: 0 },
  [OLLAMA_MODELS.CODELLAMA]: { input: 0, output: 0 },
  [OLLAMA_MODELS.DEEPSEEK_CODER_V2]: { input: 0, output: 0 },
  [OLLAMA_MODELS.QWEN_25]: { input: 0, output: 0 },
  [OLLAMA_MODELS.PHI_3]: { input: 0, output: 0 },
  [OLLAMA_MODELS.GEMMA_2]: { input: 0, output: 0 },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get display name for a model
 */
export function getModelDisplayName(modelId: string): string {
  return MODEL_DISPLAY_NAMES[modelId] || modelId;
}

/**
 * Get display name for a provider
 */
export function getProviderDisplayName(providerId: string): string {
  return PROVIDER_NAMES[providerId as ProviderId] || providerId;
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(providerId: string): string {
  return DEFAULT_MODELS[providerId as ProviderId] || '';
}

/**
 * Check if a model is recommended for its provider
 */
export function isRecommendedModel(providerId: string, modelId: string): boolean {
  const recommended = RECOMMENDED_MODELS[providerId as ProviderId];
  return recommended?.includes(modelId) || false;
}

/**
 * Get context window for a model
 */
export function getModelContextWindow(modelId: string): number {
  return MODEL_CONTEXT_WINDOWS[modelId] || 8192; // Default to 8K
}

/**
 * Get pricing for a model
 */
export function getModelPricing(modelId: string): ModelPricing | null {
  return MODEL_PRICING[modelId] || null;
}

/**
 * Calculate cost for token usage
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[modelId];
  if (!pricing) return 0;
  
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Check if a provider is a local provider (no API key needed)
 */
export function isLocalProvider(providerId: string): boolean {
  return providerId === PROVIDER_IDS.OLLAMA;
}

/**
 * Check if a provider is free (no cost per token)
 */
export function isFreeProvider(providerId: string): boolean {
  return providerId === PROVIDER_IDS.OLLAMA;
}

/**
 * Get all provider IDs as an array
 */
export function getAllProviderIds(): ProviderId[] {
  return Object.values(PROVIDER_IDS);
}

/**
 * Get all models for a provider
 */
export function getModelsForProvider(providerId: string): string[] {
  switch (providerId) {
    case PROVIDER_IDS.OPENAI:
      return Object.values(OPENAI_MODELS);
    case PROVIDER_IDS.ANTHROPIC:
      return Object.values(ANTHROPIC_MODELS);
    case PROVIDER_IDS.GOOGLE:
      return Object.values(GOOGLE_MODELS);
    case PROVIDER_IDS.GROQ:
      return Object.values(GROQ_MODELS);
    case PROVIDER_IDS.DEEPSEEK:
      return Object.values(DEEPSEEK_MODELS);
    case PROVIDER_IDS.OPENROUTER:
      return Object.values(OPENROUTER_MODELS);
    case PROVIDER_IDS.XAI:
      return Object.values(XAI_MODELS);
    case PROVIDER_IDS.AZURE:
      return Object.values(AZURE_MODELS);
    case PROVIDER_IDS.OLLAMA:
      return Object.values(OLLAMA_MODELS);
    default:
      return [];
  }
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default temperature for LLM calls
 */
export const DEFAULT_TEMPERATURE = 0.7;

/**
 * Default max tokens for LLM responses
 */
export const DEFAULT_MAX_TOKENS = 4096;

/**
 * Default timeout for LLM calls (ms)
 */
export const DEFAULT_TIMEOUT = 60_000;

// ============================================================================
// API KEY VALIDATION
// ============================================================================

/**
 * Check if a provider requires an API key
 */
export function requiresApiKey(providerId: string): boolean {
  return providerId !== PROVIDER_IDS.OLLAMA;
}

/**
 * Validate an API key format
 */
export function validateApiKey(providerId: string, apiKey: string | undefined): {
  valid: boolean;
  message?: string;
} {
  if (!apiKey || apiKey.trim() === '') {
    if (!requiresApiKey(providerId)) {
      return { valid: true };
    }
    return { valid: false, message: 'API key is required' };
  }

  const trimmed = apiKey.trim();
  
  // Provider-specific format validation
  switch (providerId) {
    case PROVIDER_IDS.OPENAI:
      if (!trimmed.startsWith('sk-')) {
        return { valid: false, message: 'OpenAI API keys should start with "sk-"' };
      }
      break;
    case PROVIDER_IDS.ANTHROPIC:
      if (!trimmed.startsWith('sk-ant-')) {
        return { valid: false, message: 'Anthropic API keys should start with "sk-ant-"' };
      }
      break;
    case PROVIDER_IDS.GOOGLE:
      if (trimmed.length < 30) {
        return { valid: false, message: 'Google API key appears too short' };
      }
      break;
    case PROVIDER_IDS.GROQ:
      if (!trimmed.startsWith('gsk_')) {
        return { valid: false, message: 'Groq API keys should start with "gsk_"' };
      }
      break;
    case PROVIDER_IDS.XAI:
      if (!trimmed.startsWith('xai-')) {
        return { valid: false, message: 'xAI API keys should start with "xai-"' };
      }
      break;
    default:
      // Generic validation for other providers
      if (trimmed.length < 20) {
        return { valid: false, message: 'API key appears too short' };
      }
  }

  return { valid: true };
}
