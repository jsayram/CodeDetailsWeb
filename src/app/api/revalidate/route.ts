import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { tag, tags } = await request.json();

    if (tag) {
      revalidateTag(tag);
    }

    if (tags && Array.isArray(tags)) {
      tags.forEach((tag) => revalidateTag(tag));
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
