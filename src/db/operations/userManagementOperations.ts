import { executeQuery } from "../server";
import { eq, sql, or, ilike, desc, SQL } from "drizzle-orm";
import { profiles } from "../schema/profiles";
import { DEFAULT_PAGE, DEFAULT_USERS_PER_PAGE } from "@/constants/project-limits";

// Type for profile update payload with SQL timestamp
type ProfileUpdatePayload = UpdateProfileData & { updated_at: SQL };

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  email_address: string | null;
  tier: string | null;
  profile_image_url: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface PaginatedUsers {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateProfileData {
  username?: string;
  full_name?: string;
  email_address?: string;
  tier?: string;
}

export type SortOption = 'recent-edit' | 'alphabetical' | 'most-active';
export type TierFilter = 'all' | 'free' | 'pro' | 'diamond';

/**
 * Get paginated list of all users with optional search
 * @param search - Optional search term to filter by username, email, or user_id
 * @param page - Page number (1-indexed)
 * @param limit - Number of users per page (default 100)
 * @param sortBy - Sort order option
 * @param tierFilter - Filter by tier
 */
export async function getAllUsers(
  search?: string,
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_USERS_PER_PAGE,
  sortBy: SortOption = 'recent-edit',
  tierFilter: TierFilter = 'all'
): Promise<PaginatedUsers> {
  return executeQuery(async (db) => {
    const offset = (page - 1) * limit;

    // Build where clause for search and tier filter
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(profiles.username, `%${search}%`),
          ilike(profiles.email_address, `%${search}%`),
          ilike(profiles.user_id, `%${search}%`),
          ilike(profiles.full_name, `%${search}%`),
          ilike(profiles.tier, `%${search}%`)
        )
      );
    }
    
    if (tierFilter !== 'all') {
      conditions.push(eq(profiles.tier, tierFilter));
    }
    
    const whereClause = conditions.length > 0 ? sql`${conditions.reduce((acc, cond) => acc ? sql`${acc} AND ${cond}` : cond)}` : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(profiles)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    // Determine sort order
    let orderByClause;
    switch (sortBy) {
      case 'alphabetical':
        orderByClause = profiles.username;
        break;
      case 'most-active':
        orderByClause = desc(profiles.created_at); // Using created_at as proxy for activity
        break;
      case 'recent-edit':
      default:
        orderByClause = desc(profiles.updated_at);
        break;
    }

    // Get paginated users
    const usersQuery = await db
      .select({
        id: profiles.id,
        user_id: profiles.user_id,
        username: profiles.username,
        full_name: profiles.full_name,
        email_address: profiles.email_address,
        tier: profiles.tier,
        profile_image_url: profiles.profile_image_url,
        created_at: profiles.created_at,
        updated_at: profiles.updated_at,
      })
      .from(profiles)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const users = usersQuery.map(u => ({
      ...u,
      created_at: u.created_at ? new Date(u.created_at) : null,
      updated_at: u.updated_at ? new Date(u.updated_at) : null,
    }));

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });
}

/**
 * Update a user's profile data
 * @param profileId - The UUID of the profile to update
 * @param updates - The fields to update
 */
export async function updateUserProfile(
  profileId: string,
  updates: UpdateProfileData
): Promise<UserProfile> {
  return executeQuery(async (db) => {
    const updateData: ProfileUpdatePayload = {
      ...updates,
      updated_at: sql`now()`,
    };

    const [updatedProfile] = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.id, profileId))
      .returning({
        id: profiles.id,
        user_id: profiles.user_id,
        username: profiles.username,
        full_name: profiles.full_name,
        email_address: profiles.email_address,
        tier: profiles.tier,
        profile_image_url: profiles.profile_image_url,
        created_at: profiles.created_at,
        updated_at: profiles.updated_at,
      });

    if (!updatedProfile) {
      throw new Error('User profile not found');
    }

    return {
      ...updatedProfile,
      created_at: updatedProfile.created_at ? new Date(updatedProfile.created_at) : null,
      updated_at: updatedProfile.updated_at ? new Date(updatedProfile.updated_at) : null,
    };
  });
}
