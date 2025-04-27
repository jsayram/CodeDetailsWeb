import { NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { eq } from "drizzle-orm";

// This route is now redundant. Use /api/profiles/[userId] for both GET and POST (update).
export const dynamic = 'error';
export function GET() {
  return new Response('This endpoint has been consolidated. Use /api/profiles/[userId].', { status: 410 });
}
export function POST() {
  return new Response('This endpoint has been consolidated. Use /api/profiles/[userId].', { status: 410 });
}
