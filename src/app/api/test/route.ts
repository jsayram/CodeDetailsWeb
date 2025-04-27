import { NextResponse } from "next/server";
import { getAnonymousClient } from "@/services/supabase";

// This test route is deprecated and not needed in production.
export const dynamic = 'error';
export function GET() {
  return new Response('This endpoint is deprecated. Remove or ignore in production.', { status: 410 });
}