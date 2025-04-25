import { NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { userId, username, profile_image_url } = await req.json();
  if (!userId || !username) {
    return NextResponse.json(
      { error: "Missing userId or username" },
      { status: 400 }
    );
  }
  try {
    const updated = await executeQuery(async (db) => {
      const [result] = await db
        .update(profiles)
        .set({ username, profile_image_url, updated_at: new Date() })
        .where(eq(profiles.user_id, userId))
        .returning();
      return result;
    });
    if (!updated) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ profile: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
