'use server';

import { auth, clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/admin-utils";
import { getAllUsers, updateUserProfile, type UpdateProfileData, type SortOption, type TierFilter } from "@/db/operations/userManagementOperations";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/swr-fetchers";
import { MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH } from "@/constants/project-limits";

/**
 * Fetch paginated users with optional search (Super Admin only)
 */
export async function fetchAllUsersAction(
  search?: string,
  page: number = 1,
  sortBy: SortOption = 'recent-edit',
  tierFilter: TierFilter = 'all'
) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized: User not logged in");
  }

  // Get user email from Clerk
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const userEmail = user.emailAddresses[0]?.emailAddress;

  // Require super admin access
  requireAdmin(userEmail);

  // Fetch users with sort option and tier filter
  const result = await getAllUsers(search, page, 100, sortBy, tierFilter);
  
  return result;
}

/**
 * Update a user's profile (Super Admin only)
 */
export async function updateUserAction(
  profileId: string,
  updates: UpdateProfileData
) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized: User not logged in");
  }

  // Get user email from Clerk
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const userEmail = user.emailAddresses[0]?.emailAddress;

  // Require super admin access
  requireAdmin(userEmail);

  // Validate updates
  if (updates.username) {
    const trimmedUsername = updates.username.trim();
    if (trimmedUsername.length < MIN_USERNAME_LENGTH) {
      throw new Error(`Username must be at least ${MIN_USERNAME_LENGTH} characters`);
    }
    if (trimmedUsername.length > MAX_USERNAME_LENGTH) {
      throw new Error(`Username must be at most ${MAX_USERNAME_LENGTH} characters`);
    }
  }

  if (updates.tier && !['free', 'pro', 'diamond'].includes(updates.tier)) {
    throw new Error("Invalid tier value");
  }

  // Update the profile
  const updatedProfile = await updateUserProfile(profileId, updates);

  // Revalidate caches
  revalidateTag(CACHE_TAGS.ADMIN_DASHBOARD, {});
  revalidateTag(CACHE_TAGS.USER_PROFILE, {});
  
  // If tier was updated, also invalidate tier cache
  if (updates.tier) {
    revalidateTag(CACHE_TAGS.USER_TIER, {});
  }
  
  // Revalidate the admin dashboard path
  revalidatePath('/dashboard/admin');

  return updatedProfile;
}

/**
 * Check if current user is super admin
 */
export async function checkIsSuperAdmin(): Promise<boolean> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return false;
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;

    const adminEmail = process.env.ADMIN_DASHBOARD_MODERATOR;
    if (!adminEmail || !userEmail) {
      return false;
    }

    return userEmail.toLowerCase().trim() === adminEmail.toLowerCase().trim();
  } catch {
    return false;
  }
}
