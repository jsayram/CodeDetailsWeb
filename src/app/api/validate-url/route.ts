/**
 * Server-side URL validation endpoint
 * Bypasses CORS restrictions by checking URLs from the server
 */

import { NextRequest, NextResponse } from 'next/server';
import { urlValidationRequestSchema } from '@/types/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = urlValidationRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json({
        reachable: false,
        error: firstError.message,
      });
    }

    const { url } = validationResult.data;

    const startTime = Date.now();
    const timeoutMs = 5000;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      // Try HEAD request first
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; URLChecker/1.0)',
          },
        });
      } catch (headError) {
        // If HEAD fails, try GET
        response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; URLChecker/1.0)',
          },
        });
      }

      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;

      // Consider successful responses and redirects as reachable
      // Also accept 405 (Method Not Allowed) since server responded
      const isReachable =
        response.ok ||
        (response.status >= 300 && response.status < 400) ||
        response.status === 405;

      return NextResponse.json({
        reachable: isReachable,
        statusCode: response.status,
        responseTime,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return NextResponse.json({
            reachable: false,
            error: `Request timed out after ${timeoutMs}ms`,
            responseTime,
          });
        }

        return NextResponse.json({
          reachable: false,
          error: error.message,
          responseTime,
        });
      }

      return NextResponse.json({
        reachable: false,
        error: 'Unknown error occurred',
        responseTime,
      });
    }
  } catch (error) {
    console.error('Error validating URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
