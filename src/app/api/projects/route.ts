import { NextRequest, NextResponse } from "next/server";
import {
  getFreeProjectsServer,
  getAccessibleProjectsServer,
} from "@/db/actions";
import {
  isValidTier,
  ValidTier,
  TIER_LEVELS,
} from "@/services/tierServiceServer";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const tier = searchParams.get("tier");

    // Debug logging
    console.log(`API request for projects with tier: ${tier || "all"}`);
    console.log(`Valid tiers are: ${Object.keys(TIER_LEVELS).join(", ")}`);

    let projects;

    // Validate tier if provided
    if (tier && !isValidTier(tier)) {
      console.error(`Invalid tier requested: ${tier}`);
      return NextResponse.json(
        {
          success: false,
          error: `Invalid tier parameter: ${tier}. Valid tiers are: ${Object.keys(
            TIER_LEVELS
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // If tier is 'free', just get free projects
    if (tier === "free") {
      console.log("Getting free projects only");
      projects = await getFreeProjectsServer();
    } else {
      console.log(`Getting projects for tier: ${tier || "all"}`);

      // Need to get a userId for the getAccessibleProjectsServer function
      const userId = "default"; // Replace with actual user ID from authentication

      // Cast tier to ValidTier type for type safety
      const validTier = tier as ValidTier | undefined;

      // Pass userId and tier to getAccessibleProjectsServer
      projects = await getAccessibleProjectsServer(userId, validTier);
      console.log(`Retrieved ${projects?.length || 0} projects`);
    }

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching projects:", errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch projects: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
