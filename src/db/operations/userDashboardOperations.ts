import { executeQuery } from "../server";
import { eq, and, sql, desc, isNull } from "drizzle-orm";
import { projects } from "../schema/projects";
import { profiles } from "../schema/profiles";
import { project_tags } from "../schema/project_tags";
import { tags } from "../schema/tags";
import { favorites } from "../schema/favorites";
import { tag_submissions } from "../schema/tag_submissions";

export interface UserDashboardStats {
  totalProjects: number;
  totalFavorites: number; // Favorites user received on their projects
  totalFavoritesGiven: number; // Favorites user gave to other projects
  projectStats: {
    totalTags: number;
    activeThisWeek: number;
    mostPopularProject: {
      id: string;
      title: string;
      favorites: number;
    } | null;
  };
  recentActivity: {
    id: string;
    slug: string;
    title: string;
    action: string;
    timestamp: Date;
  }[];
  myProjects: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    total_favorites: number;
    category: string;
    created_at: Date | null;
  }[];
  myFavorites: {
    id: string;
    slug: string;
    title: string;
    owner_username: string | null;
    category: string;
    favorited_at: Date | null;
  }[];
  topTags: {
    name: string;
    count: number;
    projects: {
      id: string;
      slug: string;
      title: string;
    }[];
  }[];
  myTagSubmissions: {
    id: string;
    tag_name: string;
    project_id: string;
    project_slug: string;
    project_title: string;
    status: string;
    admin_notes: string | null;
    created_at: Date | null;
    is_now_available: boolean;
    project_tag_count: number;
  }[];
  recentAppreciation: {
    project_id: string;
    project_slug: string;
    project_title: string;
    favoriter_username: string | null;
    favoriter_profile_image: string | null;
    favorited_at: Date | null;
  }[];
}

export async function getUserDashboardStats(userId: string): Promise<UserDashboardStats> {
  return executeQuery(async (db) => {
    // Get user's profile
    const userProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, userId))
      .limit(1);

    if (!userProfile || userProfile.length === 0) {
      throw new Error("User profile not found");
    }

    const profileId = userProfile[0].id;

    // Get total projects and activity stats for this user
    const projectStats = await db
      .select({
        total: sql<number>`count(distinct ${projects.id})`,
        activeThisWeek: sql<number>`count(distinct case 
          when ${projects.updated_at} > now() - interval '7 days' 
          then ${projects.id} end)`,
        totalFavorites: sql<number>`coalesce(sum(${projects.total_favorites}), 0)`,
      })
      .from(projects)
      .where(
        and(
          eq(projects.user_id, userId),
          isNull(projects.deleted_at)
        )
      );

    // Get user's projects
    const myProjects = await db
      .select({
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
        description: projects.description,
        total_favorites: sql<number>`coalesce(${projects.total_favorites}, 0)`,
        category: projects.category,
        created_at: projects.created_at,
      })
      .from(projects)
      .where(
        and(
          eq(projects.user_id, userId),
          isNull(projects.deleted_at)
        )
      )
      .orderBy(desc(projects.created_at))
      .limit(10);

    // Get most popular project
    const mostPopular = await db
      .select({
        id: projects.id,
        title: projects.title,
        favorites: sql<number>`coalesce(${projects.total_favorites}, 0)`,
      })
      .from(projects)
      .where(
        and(
          eq(projects.user_id, userId),
          isNull(projects.deleted_at)
        )
      )
      .orderBy(desc(projects.total_favorites))
      .limit(1);

    // Get recent activity for user's projects
    const recentActivity = await db
      .select({
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
        action: sql<string>`case 
          when ${projects.created_at} = ${projects.updated_at} 
          then 'created' 
          else 'updated' 
          end`,
        timestamp: projects.updated_at,
      })
      .from(projects)
      .where(
        and(
          eq(projects.user_id, userId),
          isNull(projects.deleted_at)
        )
      )
      .orderBy(desc(projects.updated_at))
      .limit(5);

    // Get user's favorite projects (projects they favorited)
    const myFavorites = await db
      .select({
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
        owner_username: profiles.username,
        category: projects.category,
        favorited_at: favorites.created_at,
      })
      .from(favorites)
      .innerJoin(projects, eq(projects.id, favorites.project_id))
      .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
      .where(eq(favorites.profile_id, profileId))
      .orderBy(desc(favorites.created_at))
      .limit(10);

    // Count favorites given by user
    const favoritesGivenCount = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(favorites)
      .where(eq(favorites.profile_id, profileId));

    // Get top tags used in user's projects
    const topTagsRaw = await db
      .select({
        tag_id: tags.id,
        name: tags.name,
        count: sql<number>`count(${project_tags.project_id})`,
      })
      .from(project_tags)
      .innerJoin(tags, eq(tags.id, project_tags.tag_id))
      .innerJoin(projects, eq(projects.id, project_tags.project_id))
      .where(
        and(
          eq(projects.user_id, userId),
          isNull(projects.deleted_at)
        )
      )
      .groupBy(tags.id)
      .orderBy(desc(sql<number>`count(${project_tags.project_id})`))
      .limit(10);

    // Get projects for each top tag
    const topTags = await Promise.all(
      topTagsRaw.map(async (tag) => {
        const tagProjects = await db
          .select({
            id: projects.id,
            slug: projects.slug,
            title: projects.title,
          })
          .from(project_tags)
          .innerJoin(projects, eq(projects.id, project_tags.project_id))
          .where(
            and(
              eq(project_tags.tag_id, tag.tag_id),
              eq(projects.user_id, userId),
              isNull(projects.deleted_at)
            )
          )
          .orderBy(desc(projects.updated_at));

        return {
          name: tag.name,
          count: Number(tag.count || 0),
          projects: tagProjects,
        };
      })
    );

    // Count total unique tags used by user
    const tagCount = await db
      .select({
        total: sql<number>`count(distinct ${tags.id})`,
      })
      .from(project_tags)
      .innerJoin(tags, eq(tags.id, project_tags.tag_id))
      .innerJoin(projects, eq(projects.id, project_tags.project_id))
      .where(
        and(
          eq(projects.user_id, userId),
          isNull(projects.deleted_at)
        )
      );

    // Get user's tag submissions using Drizzle ORM - only latest per tag name
    const allSubmissions = await db
      .select({
        id: tag_submissions.id,
        tag_name: tag_submissions.tag_name,
        project_id: tag_submissions.project_id,
        project_slug: projects.slug,
        project_title: projects.title,
        status: tag_submissions.status,
        admin_notes: tag_submissions.admin_notes,
        created_at: tag_submissions.created_at,
      })
      .from(tag_submissions)
      .innerJoin(projects, eq(projects.id, tag_submissions.project_id))
      .where(eq(tag_submissions.submitter_email, userProfile[0].email_address || ""))
      .orderBy(desc(tag_submissions.created_at));

    // Get all approved tags to check if rejected tags are now available
    const approvedTags = await db
      .select({
        name: tags.name,
      })
      .from(tags);
    
    const approvedTagNames = new Set(approvedTags.map(t => t.name));

    // Get tag counts for each project to check capacity
    const projectIds = [...new Set(allSubmissions.map(s => s.project_id))];
    let tagCountMap = new Map<string, number>();
    
    if (projectIds.length > 0) {
      const projectTagCounts = await db
        .select({
          project_id: project_tags.project_id,
          count: sql<number>`count(*)`,
        })
        .from(project_tags)
        .where(sql`${project_tags.project_id} IN (${sql.join(projectIds.map(id => sql.raw(`'${id}'`)), sql.raw(', '))})`)
        .groupBy(project_tags.project_id);
      
      tagCountMap = new Map(projectTagCounts.map(p => [p.project_id, Number(p.count)]));
    }

    // Filter to only show the latest submission per tag name
    const seenTags = new Set<string>();
    const myTagSubmissions = allSubmissions
      .filter(submission => {
        const key = `${submission.tag_name}`;
        if (seenTags.has(key)) {
          return false;
        }
        seenTags.add(key);
        return true;
      })
      .slice(0, 10)
      .map(sub => ({
        id: sub.id,
        tag_name: sub.tag_name,
        project_id: sub.project_id,
        project_slug: sub.project_slug,
        project_title: sub.project_title,
        status: sub.status,
        admin_notes: sub.admin_notes,
        created_at: sub.created_at,
        // Flag if this rejected tag is now available system-wide
        is_now_available: sub.status === 'rejected' && approvedTagNames.has(sub.tag_name),
        // Current tag count for the project
        project_tag_count: tagCountMap.get(sub.project_id) || 0,
      }));

    // Get recent users who favorited user's projects (Recent Appreciation)
    const recentAppreciation = await db
      .select({
        project_id: projects.id,
        project_slug: projects.slug,
        project_title: projects.title,
        favoriter_username: profiles.username,
        favoriter_profile_image: profiles.profile_image_url,
        favorited_at: favorites.created_at,
      })
      .from(favorites)
      .innerJoin(projects, eq(projects.id, favorites.project_id))
      .innerJoin(profiles, eq(profiles.id, favorites.profile_id))
      .where(
        and(
          eq(projects.user_id, userId),
          isNull(projects.deleted_at)
        )
      )
      .orderBy(desc(favorites.created_at))
      .limit(10);

    return {
      totalProjects: Number(projectStats[0]?.total || 0),
      totalFavorites: Number(projectStats[0]?.totalFavorites || 0),
      totalFavoritesGiven: Number(favoritesGivenCount[0]?.count || 0),
      projectStats: {
        totalTags: Number(tagCount[0]?.total || 0),
        activeThisWeek: Number(projectStats[0]?.activeThisWeek || 0),
        mostPopularProject: mostPopular[0] ? {
          id: mostPopular[0].id,
          title: mostPopular[0].title,
          favorites: Number(mostPopular[0].favorites || 0),
        } : null,
      },
      recentActivity: recentActivity.map(activity => ({
        ...activity,
        timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date()
      })),
      myProjects: myProjects.map(project => ({
        ...project,
        total_favorites: Number(project.total_favorites || 0),
      })),
      myFavorites: myFavorites.map(fav => ({
        ...fav,
        owner_username: fav.owner_username || "Unknown",
      })),
      topTags: topTags,
      myTagSubmissions: myTagSubmissions,
      recentAppreciation: recentAppreciation.map(appreciation => ({
        ...appreciation,
      })),
    };
  });
}
