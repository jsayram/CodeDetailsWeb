import { NextResponse } from "next/server";
import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { projects } from "@/db/schema/projects";
import { desc, sql, eq, isNull } from "drizzle-orm";

export async function GET() {
  try {
    const allProfiles = await executeQuery(async (db) =>
      db
        .select({
          id: profiles.id,
          user_id: profiles.user_id,
          username: profiles.username,
          full_name: profiles.full_name,
          profile_image_url: profiles.profile_image_url,
          tier: profiles.tier,
          email_address: profiles.email_address,
          created_at: profiles.created_at,
          updated_at: profiles.updated_at,
          project_count: sql<number>`COUNT(CASE WHEN ${projects.deleted_at} IS NULL THEN ${projects.id} END)`,
        })
        .from(profiles)
        .leftJoin(projects, eq(profiles.user_id, projects.user_id))
        .groupBy(profiles.id)
        .orderBy(desc(profiles.created_at))
    );

    return NextResponse.json(allProfiles);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}
