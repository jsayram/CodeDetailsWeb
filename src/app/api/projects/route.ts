import { NextRequest, NextResponse } from "next/server";
import {
  getAccessibleProjectsServer,
  createProjectServer,
  updateProjectServer,
  deleteProjectServer,
  getProjectBySlugServer,
  getUserProjectsServer,
  isProjectOwner,
} from "@/db/actions";
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
async function getUserPermissions(userId: string | null): Promise<{ tier: string; role: string }> {
  if (!userId) {
    return { tier: "free", role: "authenticated" };
  }

  try {
    return await executeQuery(async (db): Promise<{ tier: string; role: string }> => {
      const result = await db.execute(
        sql`SELECT tier, COALESCE(role, 'authenticated') as role FROM profiles WHERE user_id = ${userId}`
      );

      if (result.length === 0) {
        // If the profile doesn't exist, return default values
        return { tier: "free", role: "authenticated" };
      }

      return {
        tier: typeof result[0].tier === "string" ? result[0].tier : "free",
        role: typeof result[0].role === "string" ? result[0].role : "authenticated",
      };
    });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    // If there's an error, return conservative defaults
    return { tier: "free", role: "authenticated" };
  }
}

// GET handler for retrieving projects
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");
    const difficulty = searchParams.get("difficulty");
    const myProjects = searchParams.get("myProjects") === "true";

    // Debug logging
    console.log(
      `API request for projects with difficulty: ${
        difficulty || "any"
      }, myProjects: ${myProjects}`
    );
    
    // If a specific slug is provided, return that project
    if (slug) {
      const project = await getProjectBySlugServer(slug);
      if (!project) {
        return NextResponse.json(
          { success: false, error: `Project not found with slug: ${slug}` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: project });
    }

    // Define a more specific type for projects
    type ProjectType = {
      description: string | null;
      id: string;
      title: string;
      slug: string;
      tags?: string[] | null;
      difficulty: string;
      created_at: Date | null;
      updated_at: Date | null;
      deleted_at: Date | null;
      user_id: string | null;
    };

    // Initialize projectsList with an empty array to prevent undefined errors
    let projectsList: ProjectType[] = [];

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
      console.error("Authentication error:", authError);
      // Continue as anonymous user
    }

    // If myProjects is true, get only the user's own projects
    if (myProjects) {
      if (!userId) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication required to view your projects",
          },
          { status: 401 }
        );
      }

      projectsList = await getUserProjectsServer(userId);
      
      if (difficulty) {
        projectsList = projectsList.filter(
          (project) => project.difficulty === difficulty
        );
      }
    } else {
      // Get all projects with optional difficulty filter
      if (difficulty) {
        projectsList = await executeQuery(async (db) => {
          return db
            .select()
            .from(projects)
            .where(
              sql`${projects.difficulty} = ${difficulty}`
            );
        });
      } else {
        projectsList = await getAccessibleProjectsServer(
          userId || "anonymous"
        );
      }
    }

    console.log(`Retrieved ${projectsList?.length || 0} projects`);

    return NextResponse.json({
      success: true,
      data: projectsList,
    });
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    return NextResponse.json(
      { success: false, error: "Server error processing request" },
      { status: 500 }
    );
  }
}

// POST handler for creating a new project
export async function POST(request: NextRequest) {
  try {
    const projectData: InsertProject = await request.json();

    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to create projects" },
        { status: 401 }
      );
    }

    // Add the user_id to the project data
    projectData.user_id = userId;

    // Basic validation
    if (!projectData.title || !projectData.slug) {
      return NextResponse.json(
        { success: false, error: "Title and slug are required" },
        { status: 400 }
      );
    }

    // Create the project
    const project = await createProjectServer(projectData);
    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error("Error in POST /api/projects:", error);

    // Handle unique constraint violation for slugs
    if (
      error instanceof Error &&
      error.message.includes("duplicate key value violates unique constraint")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A project with that slug already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Server error creating project" },
      { status: 500 }
    );
  }
}

// PUT handler for replacing a project completely
export async function PUT(request: NextRequest) {
  try {
    // Get the project ID from the query string
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("id");

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Parse the request body
    const projectData: InsertProject = await request.json();

    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update projects" },
        { status: 401 }
      );
    }

    // Get permissions
    const { tier: userTier, role: userRole } = await getUserPermissions(userId);

    // Basic validation
    if (!projectData.title || !projectData.slug) {
      return NextResponse.json(
        { success: false, error: "Title and slug are required" },
        { status: 400 }
      );
    }

    // Check if user owns the project or is an admin
    const isOwner = await isProjectOwner(projectId, userId);
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to update this project",
        },
        { status: 403 }
      );
    }

    // Ensure trim on title and slug
    const trimmedProject: InsertProject = {
      ...projectData,
      title: projectData.title.trim(),
      slug: projectData.slug.trim(),
    };

    // Update the project using the server action
    const updatedProject = await updateProjectServer(projectId, trimmedProject);

    return NextResponse.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    console.error("Error in PUT /api/projects:", error);

    // Handle unique constraint violation for slugs
    if (
      error instanceof Error &&
      error.message.includes("duplicate key value violates unique constraint")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A project with that slug already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Server error updating project" },
      { status: 500 }
    );
  }
}

// PATCH handler for updating a project partially
export async function PATCH(request: NextRequest) {
  try {
    // Get the project ID from the query string
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("id");

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Parse the request body
    const projectData: Partial<InsertProject> = await request.json();

    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update projects" },
        { status: 401 }
      );
    }

    // Check if user owns the project or is an admin
    const isOwner = await isProjectOwner(projectId, userId);
    const { role: userRole } = await getUserPermissions(userId);
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to update this project",
        },
        { status: 403 }
      );
    }

    // Trim strings if provided
    const trimmedProject: Partial<InsertProject> = { ...projectData };
    if (trimmedProject.title !== undefined) {
      trimmedProject.title = trimmedProject.title.trim();
    }

    if (trimmedProject.slug !== undefined) {
      trimmedProject.slug = trimmedProject.slug.trim();
    }

    // Update the project using the server action
    const updatedProject = await updateProjectServer(projectId, trimmedProject);

    return NextResponse.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    console.error("Error in PATCH /api/projects:", error);

    // Handle unique constraint violation for slugs
    if (
      error instanceof Error &&
      error.message.includes("duplicate key value violates unique constraint")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A project with that slug already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Server error updating project" },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting a project
export async function DELETE(request: NextRequest) {
  try {
    // Get the project ID from the query string
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("id");

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to delete projects" },
        { status: 401 }
      );
    }

    // Check if user owns the project or is an admin
    const isOwner = await isProjectOwner(projectId, userId);
    const { role: userRole } = await getUserPermissions(userId);
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to delete this project",
        },
        { status: 403 }
      );
    }

    // Delete the project using the server action
    const deletedProject = await deleteProjectServer(projectId);

    return NextResponse.json({
      success: true,
      data: deletedProject,
    });
  } catch (error) {
    console.error("Error in DELETE /api/projects:", error);
    
    return NextResponse.json(
      { success: false, error: "Server error deleting project" },
      { status: 500 }
    );
  }
}
