/**
 * LLM API Route
 * Multi-provider LLM endpoint with caching and rate limiting
 * 
 * Supports: OpenAI, Anthropic, Google, Groq, DeepSeek, OpenRouter, xAI, Azure, Ollama
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { callLLM, PROVIDER_IDS } from '@/llm';
import { LLMError, parseLLMError } from '@/llm/errors';

// Rate limiting: Track last request time per user
const lastRequestTimes = new Map<string, number>();
const RATE_LIMIT_MS = 2000; // 2 seconds between requests

export async function POST(request: NextRequest) {
  // 1. Authentication check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { 
        success: false, 
        error: {
          type: 'https://api.codedetails.dev/problems/unauthorized',
          title: 'Unauthorized',
          status: 401,
          detail: 'Authentication required',
        }
      },
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }

  // 2. Rate limiting per user
  const lastRequest = lastRequestTimes.get(userId) || 0;
  const now = Date.now();
  
  if (now - lastRequest < RATE_LIMIT_MS) {
    const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastRequest)) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'https://api.codedetails.dev/problems/rate-limited',
          title: 'Rate Limited',
          status: 429,
          detail: `Please wait ${waitTime}s before making another request`,
        }
      },
      { status: 429, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }
  
  lastRequestTimes.set(userId, now);

  // Clean up old entries periodically
  if (lastRequestTimes.size > 1000) {
    const cutoff = now - RATE_LIMIT_MS * 10;
    for (const [id, time] of lastRequestTimes.entries()) {
      if (time < cutoff) {
        lastRequestTimes.delete(id);
      }
    }
  }

  try {
    // 3. Parse request body
    const body = await request.json();
    const { 
      prompt, 
      provider = PROVIDER_IDS.OPENAI, 
      model, 
      temperature,
      maxTokens,
      customApiKey,
      customBaseUrl,
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'https://api.codedetails.dev/problems/validation-error',
            title: 'Validation Error',
            status: 400,
            detail: 'Prompt is required and must be a string',
          }
        },
        { status: 400, headers: { 'Content-Type': 'application/problem+json' } }
      );
    }

    // 4. Call LLM
    const startTime = Date.now();
    
    const result = await callLLM({
      prompt,
      provider,
      model,
      temperature,
      maxTokens,
      customApiKey,
      customBaseUrl,
    });
    
    const latencyMs = Date.now() - startTime;

    // 5. Return result
    return NextResponse.json({
      success: true,
      result,
      metadata: {
        provider,
        model,
        latencyMs,
        cached: false, // Cache handled externally if needed
      }
    });

  } catch (error: unknown) {
    console.error('[LLM API] Error:', error);
    
    // Convert to LLMError if not already
    const llmError = error instanceof LLMError 
      ? error 
      : parseLLMError(error, 'unknown');
    
    const problemDetail = llmError.toProblemDetail(request.url);
    
    return NextResponse.json(
      { success: false, error: problemDetail },
      { status: llmError.status, headers: { 'Content-Type': 'application/problem+json' } }
    );
  }
}
