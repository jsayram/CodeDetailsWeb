/**
 * LLM Test API
 * Tests connection to an LLM provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { testProviderConnection } from '@/llm';

// Rate limiting: Track last test time per user
const lastTestTimes = new Map<string, number>();
const RATE_LIMIT_MS = 5000; // 5 seconds between tests

export async function POST(request: NextRequest) {
  // 1. Authentication check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  // 2. Rate limiting
  const lastTest = lastTestTimes.get(userId) || 0;
  const now = Date.now();
  
  if (now - lastTest < RATE_LIMIT_MS) {
    const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastTest)) / 1000);
    return NextResponse.json(
      { success: false, message: `Please wait ${waitTime}s before testing again` },
      { status: 429 }
    );
  }
  
  lastTestTimes.set(userId, now);

  // Clean up old entries
  if (lastTestTimes.size > 1000) {
    const cutoff = now - RATE_LIMIT_MS * 2;
    for (const [id, time] of lastTestTimes.entries()) {
      if (time < cutoff) {
        lastTestTimes.delete(id);
      }
    }
  }

  try {
    const body = await request.json();
    const { provider, model, apiKey, baseUrl } = body;
    
    // Verbose logging for debugging
    console.log('=== LLM Test Request ===');
    console.log('Provider:', provider);
    console.log('Model:', model);
    console.log('Custom API Key provided:', apiKey ? `Yes (length: ${apiKey.length})` : 'No');
    console.log('Custom Base URL:', baseUrl || 'None (using default)');
    
    // Log environment variable status
    console.log('--- Environment Variables Check ---');
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `Set (length: ${process.env.OPENAI_API_KEY.length})` : 'NOT SET');
    console.log('OPEN_AI_API_KEY:', process.env.OPEN_AI_API_KEY ? `Set (length: ${process.env.OPEN_AI_API_KEY.length})` : 'NOT SET');
    console.log('OPENAI_KEY:', process.env.OPENAI_KEY ? `Set (length: ${process.env.OPENAI_KEY.length})` : 'NOT SET');
    console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? `Set (length: ${process.env.ANTHROPIC_API_KEY.length})` : 'NOT SET');
    console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? `Set (length: ${process.env.GOOGLE_AI_API_KEY.length})` : 'NOT SET');
    console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? `Set (length: ${process.env.GROQ_API_KEY.length})` : 'NOT SET');
    console.log('-----------------------------------');
    
    if (!provider || !model) {
      console.log('ERROR: Missing provider or model');
      return NextResponse.json(
        { success: false, message: 'Provider and model are required' },
        { status: 400 }
      );
    }
    
    console.log('Calling testProviderConnection...');
    const result = await testProviderConnection({
      providerId: provider,
      modelId: model,
      apiKey,
      baseUrl,
    });
    
    console.log('Test Result:', JSON.stringify(result, null, 2));
    return NextResponse.json(result);
    
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, message: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
