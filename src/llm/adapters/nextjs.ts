/**
 * Next.js Adapters
 * Route handler factories and utilities for Next.js App Router
 * 
 * Pure functions that wrap LLM calls with Next.js patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { callLLM, callLLMWithMetadata } from '../client';
import { LLMError, createLLMError, LLM_ERROR_CODES } from '../errors';
import type { 
  LLMRequest, 
  LLMCallOptions, 
  LLMCallResult,
  ProblemDetail 
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface NextJSAdapterOptions {
  /** Function to validate authentication (e.g., Clerk) */
  validateAuth?: (request: NextRequest) => Promise<{ userId: string } | null>;
  /** Function to get API keys from environment or user config */
  getApiKey: (providerId: string, userId?: string) => Promise<string | null>;
  /** Optional rate limiting function */
  checkRateLimit?: (userId: string, providerId: string) => Promise<boolean>;
  /** CORS headers to include */
  corsHeaders?: Record<string, string>;
  /** Enable request logging */
  enableLogging?: boolean;
}

export interface LLMRouteBody {
  provider: string;
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface StreamingOptions {
  /** Send heartbeat pings to keep connection alive */
  heartbeatInterval?: number;
  /** Maximum time to wait for response */
  timeout?: number;
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create a JSON response with proper headers
 */
export function jsonResponse<T>(
  data: T,
  status: number = 200,
  corsHeaders?: Record<string, string>
): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

/**
 * Create an RFC 7807 Problem Detail error response
 */
export function problemResponse(
  problem: ProblemDetail,
  corsHeaders?: Record<string, string>
): NextResponse<ProblemDetail> {
  return NextResponse.json(problem, {
    status: problem.status,
    headers: {
      'Content-Type': 'application/problem+json',
      ...corsHeaders,
    },
  });
}

/**
 * Convert Error to RFC 7807 Problem Detail
 */
export function errorToProblemDetail(error: unknown): ProblemDetail {
  if (error instanceof LLMError) {
    return error.toProblemDetail();
  }
  
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  
  return {
    type: 'https://api.example.com/problems/internal-error',
    title: 'Internal Server Error',
    status: 500,
    detail: message,
    instance: `/api/llm/${Date.now()}`,
  };
}

// ============================================================================
// Route Handler Factories
// ============================================================================

/**
 * Create a POST handler for LLM calls
 * 
 * @example
 * ```ts
 * // app/api/llm/route.ts
 * import { createLLMHandler } from '@/llm/adapters/nextjs';
 * 
 * export const POST = createLLMHandler({
 *   validateAuth: async (req) => {
 *     const { userId } = await auth();
 *     return userId ? { userId } : null;
 *   },
 *   getApiKey: async (providerId) => process.env[`${providerId.toUpperCase()}_API_KEY`] || null,
 * });
 * ```
 */
export function createLLMHandler(options: NextJSAdapterOptions) {
  return async function handler(request: NextRequest): Promise<NextResponse> {
    const { validateAuth, getApiKey, checkRateLimit, corsHeaders, enableLogging } = options;
    
    try {
      // 1. Validate authentication
      let userId: string | undefined;
      if (validateAuth) {
        const authResult = await validateAuth(request);
        if (!authResult) {
          return problemResponse({
            type: 'https://api.example.com/problems/unauthorized',
            title: 'Unauthorized',
            status: 401,
            detail: 'Authentication required',
            instance: request.url,
          }, corsHeaders);
        }
        userId = authResult.userId;
      }
      
      // 2. Parse request body
      let body: LLMRouteBody;
      try {
        body = await request.json();
      } catch {
        return problemResponse({
          type: 'https://api.example.com/problems/invalid-request',
          title: 'Invalid Request',
          status: 400,
          detail: 'Invalid JSON in request body',
          instance: request.url,
        }, corsHeaders);
      }
      
      // 3. Validate required fields
      const { provider, model, prompt } = body;
      if (!provider || !model || !prompt) {
        return problemResponse({
          type: 'https://api.example.com/problems/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Missing required fields: provider, model, prompt',
          instance: request.url,
        }, corsHeaders);
      }
      
      // 4. Check rate limit
      if (checkRateLimit && userId) {
        const allowed = await checkRateLimit(userId, provider);
        if (!allowed) {
          return problemResponse({
            type: 'https://api.example.com/problems/rate-limited',
            title: 'Rate Limited',
            status: 429,
            detail: 'Too many requests. Please try again later.',
            instance: request.url,
          }, corsHeaders);
        }
      }
      
      // 5. Get API key
      const apiKey = await getApiKey(provider, userId);
      if (!apiKey) {
        return problemResponse({
          type: 'https://api.example.com/problems/configuration-error',
          title: 'Configuration Error',
          status: 500,
          detail: `API key not configured for provider: ${provider}`,
          instance: request.url,
        }, corsHeaders);
      }
      
      // 6. Build LLM options - combine prompt with config
      // Note: systemPrompt would need to be prepended to the prompt if needed
      const llmOptions: LLMCallOptions = {
        prompt: body.systemPrompt ? `${body.systemPrompt}\n\n${prompt}` : prompt,
        provider,
        model,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
        customApiKey: apiKey,
      };
      
      if (enableLogging) {
        console.log(`[LLM] Request: ${provider}/${model} - ${prompt.slice(0, 100)}...`);
      }
      
      // 7. Call LLM
      const result = await callLLMWithMetadata(llmOptions);
      
      if (enableLogging) {
        console.log(`[LLM] Response: ${result.usage?.inputTokens || 0} input, ${result.usage?.outputTokens || 0} output tokens`);
      }
      
      // 8. Return result
      return jsonResponse(result, 200, corsHeaders);
      
    } catch (error) {
      if (enableLogging) {
        console.error('[LLM] Error:', error);
      }
      return problemResponse(errorToProblemDetail(error), corsHeaders);
    }
  };
}

/**
 * Create a handler that returns just the text response (simpler API)
 */
export function createSimpleLLMHandler(options: NextJSAdapterOptions) {
  const fullHandler = createLLMHandler(options);
  
  return async function handler(request: NextRequest): Promise<NextResponse> {
    const response = await fullHandler(request);
    
    // If error response, return as-is
    if (response.status >= 400) {
      return response;
    }
    
    // Extract just the text from successful response
    const result = await response.json() as LLMCallResult;
    
    return jsonResponse(
      { text: result.content },
      200,
      options.corsHeaders
    );
  };
}

// ============================================================================
// Streaming Handler
// ============================================================================

/**
 * Create a streaming handler for LLM responses
 * Uses Server-Sent Events (SSE) format
 * 
 * Note: Requires LLM client to support streaming (not all providers support this)
 */
export function createStreamingLLMHandler(
  options: NextJSAdapterOptions,
  _streamOptions?: StreamingOptions
) {
  return async function handler(request: NextRequest): Promise<Response> {
    const { validateAuth, getApiKey, checkRateLimit, corsHeaders, enableLogging } = options;
    
    try {
      // Authentication and validation (same as regular handler)
      let userId: string | undefined;
      if (validateAuth) {
        const authResult = await validateAuth(request);
        if (!authResult) {
          return new Response(
            JSON.stringify({
              type: 'https://api.example.com/problems/unauthorized',
              title: 'Unauthorized',
              status: 401,
              detail: 'Authentication required',
            }),
            { status: 401, headers: { 'Content-Type': 'application/problem+json', ...corsHeaders } }
          );
        }
        userId = authResult.userId;
      }
      
      const body: LLMRouteBody = await request.json();
      const { provider, model, prompt } = body;
      
      if (!provider || !model || !prompt) {
        return new Response(
          JSON.stringify({
            type: 'https://api.example.com/problems/validation-error',
            title: 'Validation Error',
            status: 400,
            detail: 'Missing required fields',
          }),
          { status: 400, headers: { 'Content-Type': 'application/problem+json', ...corsHeaders } }
        );
      }
      
      if (checkRateLimit && userId) {
        const allowed = await checkRateLimit(userId, provider);
        if (!allowed) {
          return new Response(
            JSON.stringify({
              type: 'https://api.example.com/problems/rate-limited',
              title: 'Rate Limited',
              status: 429,
              detail: 'Too many requests',
            }),
            { status: 429, headers: { 'Content-Type': 'application/problem+json', ...corsHeaders } }
          );
        }
      }
      
      const apiKey = await getApiKey(provider, userId);
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            type: 'https://api.example.com/problems/configuration-error',
            title: 'Configuration Error',
            status: 500,
            detail: `API key not configured for provider: ${provider}`,
          }),
          { status: 500, headers: { 'Content-Type': 'application/problem+json', ...corsHeaders } }
        );
      }
      
      if (enableLogging) {
        console.log(`[LLM Stream] Request: ${provider}/${model}`);
      }
      
      // For now, use non-streaming call and return result
      // TODO: Implement actual streaming when supported by client
      const llmOptions: LLMCallOptions = {
        prompt: body.systemPrompt ? `${body.systemPrompt}\n\n${prompt}` : prompt,
        provider,
        model,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
        customApiKey: apiKey,
      };
      
      const result = await callLLM(llmOptions);
      
      // Create a readable stream that sends the result as SSE
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send result as single SSE event
          const data = `data: ${JSON.stringify({ text: result, done: true })}\n\n`;
          controller.enqueue(encoder.encode(data));
          controller.close();
        },
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders,
        },
      });
      
    } catch (error) {
      if (enableLogging) {
        console.error('[LLM Stream] Error:', error);
      }
      
      const problem = errorToProblemDetail(error);
      return new Response(
        JSON.stringify(problem),
        { status: problem.status, headers: { 'Content-Type': 'application/problem+json', ...corsHeaders } }
      );
    }
  };
}

// ============================================================================
// Middleware Helpers
// ============================================================================

/**
 * CORS preflight handler for OPTIONS requests
 */
export function createCorsHandler(corsHeaders: Record<string, string>) {
  return function handler(): NextResponse {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        ...corsHeaders,
      },
    });
  };
}

/**
 * Common CORS headers for LLM APIs
 */
export const defaultCorsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ============================================================================
// API Key Helpers
// ============================================================================

/**
 * Get API key from environment variables with standard naming
 * 
 * @param providerId - Provider identifier
 * @returns API key or null
 */
export function getApiKeyFromEnv(providerId: string): string | null {
  const envKeyMap: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_AI_API_KEY',
    groq: 'GROQ_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    xai: 'XAI_API_KEY',
    azure: 'AZURE_OPENAI_API_KEY',
  };
  
  const envKey = envKeyMap[providerId];
  if (!envKey) return null;
  
  return process.env[envKey] || null;
}

/**
 * Create a getApiKey function that reads from environment
 */
export function createEnvApiKeyGetter(): (providerId: string) => Promise<string | null> {
  return async (providerId: string) => getApiKeyFromEnv(providerId);
}
