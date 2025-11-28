import { updateTag } from "next/cache";
import { NextResponse } from "next/server";
import { revalidateRequestSchema } from "@/types/schemas";
import { invalidInput, validationError, success } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = revalidateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        validationResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }))
      );
    }

    const { tag, tags } = validationResult.data;

    if (tag) {
      updateTag(tag);
    }

    if (tags && Array.isArray(tags)) {
      tags.forEach((t) => updateTag(t));
    }

    return success({ revalidated: true, now: Date.now() });
  } catch (err) {
    return invalidInput("Invalid request body");
  }
}
