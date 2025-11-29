import { revalidateTag } from "next/cache";
import { revalidateRequestSchema } from "@/types/schemas";
import { invalidInput, validationError, success } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("🔄 Revalidate request body:", JSON.stringify(body, null, 2));

    // Validate input with Zod schema
    const validationResult = revalidateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const issues = validationResult.error.issues;
      console.error("❌ Revalidate validation failed:");
      issues.forEach((issue, i) => {
        console.error(`  Issue ${i + 1}: path=${issue.path.join('.')}, message=${issue.message}, code=${issue.code}`);
      });
      
      return await validationError(
        issues.map((issue) => ({
          field: issue.path.join('.') || 'request',
          message: issue.message,
        }))
      );
    }

    const { tag, tags } = validationResult.data;
    console.log("✅ Validation passed. Tags to revalidate:", { tag, tags });

    // Next.js 16: revalidateTag requires a second argument (profile)
    // Using empty object {} for default cache profile
    if (tag) {
      revalidateTag(tag, {});
      console.log(`🔄 Revalidated tag: ${tag}`);
    }

    if (tags && Array.isArray(tags)) {
      tags.forEach((t) => {
        revalidateTag(t, {});
        console.log(`🔄 Revalidated tag: ${t}`);
      });
    }

    return await success({ revalidated: true, now: Date.now() });
  } catch (err) {
    console.error("❌ Revalidate route error:", err);
    return await invalidInput("Invalid request body");
  }
}
