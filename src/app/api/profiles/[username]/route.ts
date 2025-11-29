import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/db/server";
import { profiles } from "@/db/schema/profiles";
import { usernameHistory } from "@/db/schema/username-history";
import { eq } from "drizzle-orm";
import { 
  notFound, 
  unauthorized, 
  notOwner,
  validationError, 
  serverError,
  success 
} from "@/lib/api-errors";
import { updateProfileSchema, formatZodErrors } from "@/types/schemas/profile";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    
    const profile = await executeQuery(async (db) => {
      const result = await db
        .select()
        .from(profiles)
        .where(eq(profiles.username, username))
        .limit(1);

      return result[0] || null;
    });

    if (!profile) {
      // Profile not found - check if this is a historical username
      const historyRecord = await executeQuery(async (db) => {
        return await db
          .select()
          .from(usernameHistory)
          .where(eq(usernameHistory.old_username, username))
          .limit(1);
      });

      if (historyRecord.length) {
        // Found in history - look up current username by user_id
        const currentProfile = await executeQuery(async (db) => {
          return await db
            .select()
            .from(profiles)
            .where(eq(profiles.user_id, historyRecord[0].user_id))
            .limit(1);
        });

        if (currentProfile.length) {
          // Return redirect info with current profile
          return success({
            redirect: true,
            oldUsername: username,
            currentUsername: currentProfile[0].username,
            profile: currentProfile[0],
          });
        }
      }

      // No profile found and no history - return 404
      return notFound("profile", { 
        identifier: username, 
        identifierType: "username" 
      });
    }

    return success({ profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return serverError(error, "Failed to fetch profile");
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      return unauthorized("You must be signed in to update a profile");
    }

    const { username } = await context.params;

    // 2. Check if the profile exists and user owns it
    const existingProfile = await executeQuery(async (db) => {
      const result = await db
        .select()
        .from(profiles)
        .where(eq(profiles.username, username))
        .limit(1);
      return result[0] || null;
    });

    if (!existingProfile) {
      return notFound("profile", { 
        identifier: username, 
        identifierType: "username" 
      });
    }

    // 3. Authorization check - user must own the profile
    if (existingProfile.user_id !== userId) {
      return notOwner("profile", {
        resource: "profile",
        identifier: username,
        operation: "PUT",
        userId,
      });
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);
    
    if (!validation.success) {
      return validationError(
        formatZodErrors(validation.error),
        "Invalid profile data provided"
      );
    }

    const validatedData = validation.data;

    // 5. Update the profile
    const updatedProfile = await executeQuery(async (db) => {
      const [result] = await db
        .update(profiles)
        .set({
          ...(validatedData.username && { username: validatedData.username }),
          ...(validatedData.email_address && { email_address: validatedData.email_address }),
          ...(validatedData.profile_image_url !== undefined && { profile_image_url: validatedData.profile_image_url }),
          ...(validatedData.full_name !== undefined && { full_name: validatedData.full_name }),
          ...(validatedData.first_name !== undefined && { first_name: validatedData.first_name }),
          ...(validatedData.last_name !== undefined && { last_name: validatedData.last_name }),
          ...(validatedData.bio !== undefined && { bio: validatedData.bio }),
          updated_at: new Date(),
        })
        .where(eq(profiles.username, username))
        .returning();

      return result;
    });

    return success({ profile: updatedProfile });
  } catch (error) {
    console.error("Error updating profile:", error);
    return serverError(error, "Failed to update profile");
  }
}
