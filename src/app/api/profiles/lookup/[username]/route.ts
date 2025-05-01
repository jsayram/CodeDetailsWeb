import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { eq, or } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> | { username: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const username = decodeURIComponent(resolvedParams.username);

    const profile = await executeQuery(async (db) => {
      return await db
        .select()
        .from(profiles)
        .where(
          or(
            eq(profiles.username, username),
            eq(profiles.email_address, username)
          )
        )
        .limit(1);
    });

    if (!profile.length) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: profile[0],
    });
  } catch (error) {
    console.error("Error looking up profile:", error);
    return NextResponse.json(
      { error: "Failed to lookup profile" },
      { status: 500 }
    );
  }
}
