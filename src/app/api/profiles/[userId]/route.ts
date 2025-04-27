import { NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  try {
    const profile = await executeQuery(async (db) => {
      const result = await db
        .select()
        .from(profiles)
        .where(eq(profiles.user_id, userId));
      return result[0] || null;
    });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const userId = params.userId;
  const { username, profile_image_url } = await req.json();
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
