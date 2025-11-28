import { updateTag } from "next/cache";
import { NextResponse } from "next/server";
import { revalidateRequestSchema } from "@/types/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = revalidateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json(
        { 
          error: firstError.message,
          validationErrors: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        }, 
        { status: 400 }
      );
    }

    const { tag, tags } = validationResult.data;

    if (tag) {
      updateTag(tag);
    }

    if (tags && Array.isArray(tags)) {
      tags.forEach((t) => updateTag(t));
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
