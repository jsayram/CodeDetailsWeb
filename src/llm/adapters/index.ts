/**
 * LLM Adapters
 * Integration adapters for different frameworks
 */

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
} from './nextjs';
