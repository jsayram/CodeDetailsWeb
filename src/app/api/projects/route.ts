import { NextRequest, NextResponse } from "next/server";
import {
  getFreeProjectsServer,
  getAccessibleProjectsServer,
  createProjectServer,
  updateProjectServer,
  deleteProjectServer,
  getProjectBySlugServer,
} from "@/db/actions";
import {
  isValidTier,
  TIER_LEVELS,
  canAccessTier,
} from "@/services/tierServiceServer";
import { InsertProject } from "@/db/schema/projects";
import { projects } from "@/db/schema/projects";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/db/server";
import { sql } from "drizzle-orm";

/**
 * Helper function to check user's permissions from the profiles table
 * @param userId The user ID to check permissions for
 * @returns Object with user's tier and role, defaults to free tier and authenticated role
 */
async function getUserPermissions(userId: string | null) {
  // Default permissions
  const defaultPermissions = { tier: "free", role: "authenticated" };

  // If no userId, return default permissions
  if (!userId) return defaultPermissions;

  try {
    return await executeQuery(async (db) => {
      // Get user profile from database
      const profiles = await db.execute<{ tier: string; role: string }>(
        sql`SELECT tier, role FROM profiles WHERE user_id = ${userId}`
      );

      // If profile exists, return tier and role, otherwise return defaults
      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        console.log(
          `Found profile for user ${userId}: tier=${profile.tier}, role=${profile.role}`
        );
        return {
          tier: isValidTier(profile.tier) ? profile.tier : "free",
          role: profile.role || "authenticated",
        };
      } else {
        console.log(
          `No profile found for user ${userId} in the profiles table, using defaults`
        );
      }

      return defaultPermissions;
    });
  } catch (error) {
    console.error(`Error fetching user permissions for user ${userId}:`, error);
    return defaultPermissions;
  }
}

// GET handler for retrieving projects
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const tier = searchParams.get("tier");
    const slug = searchParams.get("slug");
    const difficulty = searchParams.get("difficulty");

    // Debug logging
    console.log(
      `API request for projects with tier: ${tier || "free"}, difficulty: ${
        difficulty || "beginner"
      }`
    );
    console.log(`Valid tiers are: ${Object.keys(TIER_LEVELS).join(", ")}`);

    // If a specific slug is provided, return that project
    if (slug) {
      const project = await getProjectBySlugServer(slug);
      if (!project) {
        return NextResponse.json(
          { success: false, error: `Project not found with slug: ${slug}` },
          { status: 404 }
        );
      }

      // Check user's permissions for this specific project
      try {
        const { userId } = await auth();
        if (userId && project.tier !== "free") {
          const { tier: userTier } = await getUserPermissions(userId);
          if (!canAccessTier(userTier, project.tier)) {
            return NextResponse.json(
              {
                success: false,
                error: `Access denied: This project requires ${project.tier} tier access`,
              },
              { status: 403 }
            );
          }
        }
      } catch (authError) {
        const errorMessage =
          authError instanceof Error ? authError.message : String(authError);
        console.log(`❌ Authentication error: ${errorMessage}`);
        // For non-free projects, require authentication
        if (project.tier !== "free") {
          return NextResponse.json(
            {
              success: false,
              error: "Authentication required to access this project",
            },
            { status: 401 }
          );
        }
      }

      return NextResponse.json({ success: true, data: project });
    }

    // Define a more specific type for projects instead of using any
    type ProjectType = {
      description: string | null;
      tier: string;
      id: string;
      title: string;
      slug: string;
      tags: string[] | null;
      difficulty: string;
      created_at: Date | null;
    };

    let projectsList: ProjectType[];

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

    // Check user auth status and permissions
    let userId = null;
    let userTier = "free";
    let userRole = "authenticated";

    try {
      const authResult = await auth();
      userId = authResult.userId;

      if (userId) {
        console.log(`✅ Successfully authenticated user with ID: ${userId}`);
        // Get permissions from the profiles table
        const permissions = await getUserPermissions(userId);
        userTier = permissions.tier;
        userRole = permissions.role;
        console.log(`User ${userId} has tier: ${userTier}, role: ${userRole}`);
      } else {
        console.log(
          "❌ Authentication failed: No user ID was found in auth result"
        );
      }
    } catch (authError) {
      const errorMessage =
        authError instanceof Error ? authError.message : String(authError);
      console.log(`❌ Authentication error: ${errorMessage}`);
      console.log("Using anonymous access as fallback");
    }

    // If a specific tier is requested, check if user has access
    if (tier && tier !== "free") {
      // If user is not authenticated, they can only access free content
      if (!userId) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication required to access non-free projects",
          },
          { status: 401 }
        );
      }

      // Check if user has access to the requested tier
      if (!canAccessTier(userTier, tier)) {
        return NextResponse.json(
          {
            success: false,
            error: `Access denied: Your tier (${userTier}) doesn't have access to ${tier} projects`,
          },
          { status: 403 }
        );
      }
    }

    // If tier is 'free' or not specified and user is not authenticated, just get free projects
    if (tier === "free" || (!userId && !tier)) {
      console.log("Getting free projects only");

      if (difficulty) {
        console.log(`Filtering free projects by difficulty: ${difficulty}`);
        projectsList = await executeQuery(async (db) => {
          return db
            .select()
            .from(projects)
            .where(
              sql`${projects.tier} = 'free' AND ${projects.difficulty} = ${difficulty}`
            );
        });
      } else {
        projectsList = await getFreeProjectsServer();
      }
    } else {
      // For authenticated users or when tier is specified
      console.log(`Getting projects for tier: ${tier || userTier}`);

      // Use the specified tier or the user's tier level
      const effectiveTier = tier || userTier;

      // Get projects accessible to the user, with optional difficulty filter
      if (difficulty) {
        console.log(
          `Filtering accessible projects by difficulty: ${difficulty} and tier: ${effectiveTier}`
        );
        projectsList = await executeQuery(async (db) => {
          // Build WHERE condition based on tier
          let tierCondition;
          if (effectiveTier === "diamond") {
            tierCondition = sql`(${projects.tier} = 'free' OR ${projects.tier} = 'pro' OR ${projects.tier} = 'diamond')`;
          } else if (effectiveTier === "pro") {
            tierCondition = sql`(${projects.tier} = 'free' OR ${projects.tier} = 'pro')`;
          } else {
            tierCondition = sql`${projects.tier} = 'free'`;
          }

          // Combine tier and difficulty conditions
          return db
            .select()
            .from(projects)
            .where(
              sql`${tierCondition} AND ${projects.difficulty} = ${difficulty}`
            );
        });
      } else {
        projectsList = await getAccessibleProjectsServer(
          userId || "anonymous",
          effectiveTier
        );
      }

      console.log(`Retrieved ${projectsList?.length || 0} projects`);
    }

    return NextResponse.json({
      success: true,
      data: projectsList,
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

// POST handler for creating new projects
export async function POST(request: NextRequest) {
  try {
    // Get the current user's ID
    let userId: string | null = null;
    let userRole: string = "authenticated";
    let userTier: string = "free";

    try {
      console.log("Attempting to authenticate user for POST request...");
      const authResult = await auth();
      userId = authResult.userId;

      if (!userId) {
        console.log(
          "❌ Authentication failed: No user ID found in auth result"
        );
        return NextResponse.json(
          {
            success: false,
            error:
              "Authentication failed: Unable to identify the current user. Please ensure you are logged in and try again.",
          },
          { status: 401 }
        );
      }

      console.log(`✅ Successfully authenticated user with ID: ${userId}`);

      // If user is authenticated, get their role and tier from the profiles table
      const { role, tier } = await getUserPermissions(userId);
      userRole = role;
      userTier = tier;
    } catch (authError) {
      const errorMessage =
        authError instanceof Error ? authError.message : String(authError);
      console.error(`❌ Authentication error: ${errorMessage}`);
      return NextResponse.json(
        {
          success: false,
          error: `Authentication service unavailable: ${errorMessage}. Please try again later or contact support if the issue persists.`,
        },
        { status: 401 }
      );
    }

    // Require authentication for creating projects
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the request body
    const projectData = await request.json();

    // Basic validation
    if (!projectData.title || !projectData.slug) {
      return NextResponse.json(
        { success: false, error: "Project title and slug are required" },
        { status: 400 }
      );
    }

    // Check if user has the required tier/role to create a project with the specified tier
    if (projectData.tier && projectData.tier !== "free") {
      // Only allow authenicated roles to create non-free projects
      if (userRole !== "authenticated") {
        return NextResponse.json(
          {
            success: false,
            error: "Only authenticated can create non-free projects",
          },
          { status: 403 }
        );
      }

      // Even for authenicated roles, check tier access
      if (!canAccessTier(userTier, projectData.tier)) {
        return NextResponse.json(
          {
            success: false,
            error: `You don't have access to create ${projectData.tier} tier projects`,
          },
          { status: 403 }
        );
      }
    }

    // Ensure trim on title and slug
    const trimmedProject: InsertProject = {
      ...projectData,
      title: projectData.title.trim(),
      slug: projectData.slug.trim(),
    };

    // Create the project using the server action
    const newProject = await createProjectServer(trimmedProject);

    return NextResponse.json(
      { success: true, data: newProject },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating project:", errorMessage);

    // Handle duplicate slug or title specifically
    if (errorMessage.includes("already exists")) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 409 } // Conflict
      );
    }

    return NextResponse.json(
      { success: false, error: `Failed to create project: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PUT handler for replacing a project completely
export async function PUT(request: NextRequest) {
  try {
    // Get the current user's ID and role
    let userId: string | null = null;
    let userRole: string = "authenticated";
    let userTier: string = "free";

    try {
      console.log("Attempting to authenticate user for PUT request...");
      const authResult = await auth();
      userId = authResult.userId;

      if (!userId) {
        console.log(
          "❌ Authentication failed: No user ID found in auth result"
        );
        return NextResponse.json(
          {
            success: false,
            error:
              "Authentication failed: Unable to identify the current user. Please ensure you are logged in and try again.",
          },
          { status: 401 }
        );
      }

      console.log(`✅ Successfully authenticated user with ID: ${userId}`);

      // If user is authenticated, get their role and tier from the profiles table
      const { role, tier } = await getUserPermissions(userId);
      userRole = role;
      userTier = tier;
    } catch (authError) {
      const errorMessage =
        authError instanceof Error ? authError.message : String(authError);
      console.error(`❌ Authentication error: ${errorMessage}`);
      return NextResponse.json(
        {
          success: false,
          error: `Authentication service unavailable: ${errorMessage}. Please try again later or contact support if the issue persists.`,
        },
        { status: 401 }
      );
    }

    // Require authentication for updating projects
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the project ID from query params
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Parse the request body
    const projectData = await request.json();

    // Basic validation for required fields in a full update
    if (!projectData.title || !projectData.slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Project title and slug are required for a full update",
        },
        { status: 400 }
      );
    }

    // Check if user has the required tier/role to update to a different tier
    if (projectData.tier && projectData.tier !== "free") {
      // Only allow authenicated roles to update to non-free tier projects
      if (userRole !== "authenticated") {
        return NextResponse.json(
          {
            success: false,
            error: "Only administrators can update to non-free tiers",
          },
          { status: 403 }
        );
      }

      // Even for authenicated roles, check tier access
      if (!canAccessTier(userTier, projectData.tier)) {
        return NextResponse.json(
          {
            success: false,
            error: `You don't have access to the ${projectData.tier} tier`,
          },
          { status: 403 }
        );
      }
    }

    // Ensure trim on title and slug
    const trimmedProject: InsertProject = {
      ...projectData,
      title: projectData.title.trim(),
      slug: projectData.slug.trim(),
    };

    // Update the project using the server action
    const updatedProject = await updateProjectServer(id, trimmedProject);

    return NextResponse.json({ success: true, data: updatedProject });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating project:", errorMessage);

    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 404 }
      );
    }

    if (errorMessage.includes("already exists")) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: `Failed to update project: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PATCH handler for partial project updates
export async function PATCH(request: NextRequest) {
  try {
    // Get the current user's ID and role
    let userId: string | null = null;
    let userRole: string = "authenticated";
    let userTier: string = "free";

    try {
      console.log("Attempting to authenticate user for PATCH request...");
      const authResult = await auth();
      userId = authResult.userId;

      if (!userId) {
        console.log(
          "❌ Authentication failed: No user ID found in auth result"
        );
        return NextResponse.json(
          {
            success: false,
            error:
              "Authentication failed: Unable to identify the current user. Please ensure you are logged in and try again.",
          },
          { status: 401 }
        );
      }

      console.log(`✅ Successfully authenticated user with ID: ${userId}`);

      // If user is authenticated, get their role and tier from the profiles table
      const { role, tier } = await getUserPermissions(userId);
      userRole = role;
      userTier = tier;
    } catch (authError) {
      const errorMessage =
        authError instanceof Error ? authError.message : String(authError);
      console.error(`❌ Authentication error: ${errorMessage}`);
      return NextResponse.json(
        {
          success: false,
          error: `Authentication service unavailable: ${errorMessage}. Please try again later or contact support if the issue persists.`,
        },
        { status: 401 }
      );
    }

    // Require authentication for updating projects
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the project ID from query params
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Parse the request body
    const projectData = await request.json();

    // For PATCH, we just need to make sure any provided fields are valid
    const trimmedProject: Partial<InsertProject> = { ...projectData };

    // Check if user has the required tier/role to update to a different tier
    if (trimmedProject.tier && trimmedProject.tier !== "free") {
      // Only allow authenicated roles to update to non-free tier projects
      if (userRole !== "authenticated") {
        return NextResponse.json(
          {
            success: false,
            error: "Only administrators can update to non-free tiers",
          },
          { status: 403 }
        );
      }

      // Even for authenicated roles, check tier access
      if (!canAccessTier(userTier, trimmedProject.tier)) {
        return NextResponse.json(
          {
            success: false,
            error: `You don't have access to the ${trimmedProject.tier} tier`,
          },
          { status: 403 }
        );
      }
    }

    // Trim title and slug if provided
    if (trimmedProject.title !== undefined) {
      trimmedProject.title = trimmedProject.title.trim();
      if (!trimmedProject.title) {
        return NextResponse.json(
          { success: false, error: "Project title cannot be empty" },
          { status: 400 }
        );
      }
    }

    if (trimmedProject.slug !== undefined) {
      trimmedProject.slug = trimmedProject.slug.trim();
      if (!trimmedProject.slug) {
        return NextResponse.json(
          { success: false, error: "Project slug cannot be empty" },
          { status: 400 }
        );
      }
    }

    // Update the project using the server action
    const updatedProject = await updateProjectServer(id, trimmedProject);

    return NextResponse.json({ success: true, data: updatedProject });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error patching project:", errorMessage);

    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 404 }
      );
    }

    if (errorMessage.includes("already exists")) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: `Failed to update project: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE handler for removing projects
export async function DELETE(request: NextRequest) {
  try {
    // Get the current user's ID and role
    let userId: string | null = null;
    let userRole: string = "authenticated";

    try {
      console.log("Attempting to authenticate user for DELETE request...");
      const authResult = await auth();
      userId = authResult.userId;

      if (!userId) {
        console.log(
          "❌ Authentication failed: No user ID found in auth result"
        );
        return NextResponse.json(
          {
            success: false,
            error:
              "Authentication failed: Unable to identify the current user. Please ensure you are logged in and try again.",
          },
          { status: 401 }
        );
      }

      console.log(`✅ Successfully authenticated user with ID: ${userId}`);

      // If user is authenticated, get their role from the profiles table
      const { role } = await getUserPermissions(userId);
      userRole = role;
    } catch (authError) {
      const errorMessage =
        authError instanceof Error ? authError.message : String(authError);
      console.error(`❌ Authentication error: ${errorMessage}`);
      return NextResponse.json(
        {
          success: false,
          error: `Authentication service unavailable: ${errorMessage}. Please try again later or contact support if the issue persists.`,
        },
        { status: 401 }
      );
    }

    // Require authentication for deleting projects
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the project ID from query params
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Only allow authenicated roles to delete projects
    if (userRole !== "authenticated") {
      return NextResponse.json(
        { success: false, error: "Only administrators can delete projects" },
        { status: 403 }
      );
    }

    // Delete the project using the server action
    const deletedProject = await deleteProjectServer(id);

    return NextResponse.json({ success: true, data: deletedProject });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting project:", errorMessage);

    if (errorMessage.includes("not found")) {
      return NextResponse.json(
        { success: false, error: "Project not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: `Failed to delete project: ${errorMessage}` },
      { status: 500 }
    );
  }
}
