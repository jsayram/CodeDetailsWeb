import { executeQuery } from "../server";
import { eq, and, sql, desc, isNull, inArray } from "drizzle-orm";
import { projects } from "../schema/projects";
import { profiles } from "../schema/profiles";
import { project_tags } from "../schema/project_tags";
import { tags } from "../schema/tags";

export interface DashboardStats {
  totalProjects: number;
  activeUsers: number;
  recentActivity: {
    id: string;
    title: string;
    action: string;
    username: string;
    timestamp: Date;
  }[];
  projectsNeedingAttention: {
    id: string;
    title: string;
    slug: string;
    owner: string;
    missingDescription: boolean;
    missingTags: boolean;
    issueCount: number;
  }[];
  mostPopularProjects: {
    id: string;
    title: string;
    favorites: number;
    owner: string;
  }[];
  projectStats: {
    totalFavorites: number;
    totalTags: number;
    activeThisWeek: number;
  };
  topTags: {
    name: string;
    count: number;
  }[];
  allProjects: {
    id: string;
    title: string;
    slug: string;
    total_favorites: number;
    category: string;
    owner: string;
    created_at: Date | null;
    tag_count: number;
  }[];
  userGrowth: {
    totalUsers: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  };
  categoryDistribution: {
    category: string;
    count: number;
    percentage: number;
  }[];
  engagementMetrics: {
    avgFavoritesPerProject: number;
    avgTagsPerProject: number;
    projectsWithoutFavorites: number;
    projectsWithoutTags: number;
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return executeQuery(async (db) => {
    // Get total projects and activity stats in a single query with explicit typing
    const projectStats = await db
      .select({
        total: sql<number>`count(distinct ${projects.id})`,
        activeThisWeek: sql<number>`count(distinct case 
          when ${projects.updated_at} > now() - interval '7 days' 
          then ${projects.id} end)`,
        totalFavorites: sql<number>`coalesce(sum(${projects.total_favorites}), 0)`,
      })
      .from(projects)
      .where(isNull(projects.deleted_at));

    // Get all projects for the overview chart with additional details
    const allProjectsQuery = await db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        total_favorites: sql<number>`coalesce(${projects.total_favorites}, 0)`,
        category: projects.category,
        owner: sql<string>`coalesce(${profiles.username}, 'Unknown User')`,
        created_at: projects.created_at,
        tag_count: sql<number>`(
          SELECT count(*)
          FROM ${project_tags}
          WHERE ${project_tags.project_id} = ${projects.id}
        )`,
      })
      .from(projects)
      .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
      .where(isNull(projects.deleted_at))
      .orderBy(desc(projects.total_favorites));

    const allProjects = allProjectsQuery.map(p => ({
      ...p,
      tag_count: Number(p.tag_count || 0)
    }));

    // Get active users with proper join and explicit typing
    const activeUsers = await db
      .select({
        count: sql<number>`count(distinct ${profiles.id})`,
      })
      .from(profiles)
      .innerJoin(projects, eq(projects.user_id, profiles.user_id))
      .where(sql`${projects.updated_at} > now() - interval '7 days'`);

    // Get recent activity with proper null handling and explicit field selection
    const recentActivity = await db
      .select({
        id: projects.id,
        title: projects.title,
        action: sql<string>`case 
          when ${projects.created_at} = ${projects.updated_at} 
          then 'created' 
          else 'updated' 
          end`,
        username: sql<string>`coalesce(${profiles.username}, 'Unknown User')`,
        timestamp: projects.updated_at,
      })
      .from(projects)
      .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
      .where(isNull(projects.deleted_at))
      .orderBy(desc(projects.updated_at))
      .limit(5);

    // Get projects needing attention (missing description or tags)
    const projectsNeedingAttentionQuery = await db
      .select({
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        owner: sql<string>`coalesce(${profiles.username}, 'Unknown User')`,
        missingDescription: sql<boolean>`(${projects.description} IS NULL OR length(trim(${projects.description})) = 0)`,
        missingTags: sql<boolean>`NOT EXISTS (
          SELECT 1 FROM ${project_tags} 
          WHERE ${project_tags.project_id} = ${projects.id}
          LIMIT 1
        )`,
        issueCount: sql<number>`(
          CASE WHEN ${projects.description} IS NULL OR length(trim(${projects.description})) = 0 THEN 1 ELSE 0 END +
          CASE WHEN NOT EXISTS (
            SELECT 1 FROM ${project_tags} 
            WHERE ${project_tags.project_id} = ${projects.id}
            LIMIT 1
          ) THEN 1 ELSE 0 END
        )::numeric`
      })
      .from(projects)
      .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
      .where(isNull(projects.deleted_at))
      .orderBy(desc(sql<number>`(
        CASE WHEN ${projects.description} IS NULL OR length(trim(${projects.description})) = 0 THEN 1 ELSE 0 END +
        CASE WHEN NOT EXISTS (
          SELECT 1 FROM ${project_tags} 
          WHERE ${project_tags.project_id} = ${projects.id}
          LIMIT 1
        ) THEN 1 ELSE 0 END
      )`), desc(projects.created_at));

    // Filter out projects with no issues
    const projectsNeedingAttention = projectsNeedingAttentionQuery.filter(
      project => Number(project.issueCount) > 0
    );

    // Get most popular projects with proper joins and field selection
    const mostPopularProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        favorites: sql<number>`coalesce(${projects.total_favorites}, 0)`,
        owner: sql<string>`coalesce(${profiles.username}, 'Unknown User')`,
      })
      .from(projects)
      .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
      .where(isNull(projects.deleted_at))
      .orderBy(desc(projects.total_favorites))
      .limit(3);

    // Get top tags with proper counting and joins
    const topTags = await db
      .select({
        name: tags.name,
        count: sql<number>`count(${project_tags.project_id})`,
      })
      .from(tags)
      .leftJoin(project_tags, eq(project_tags.tag_id, tags.id))
      .groupBy(tags.id)
      .orderBy(desc(sql<number>`count(${project_tags.project_id})`))
      .limit(10);

    // Count total tags using explicit counting
    const tagStats = await db
      .select({
        total: sql<number>`count(distinct ${tags.id})`,
      })
      .from(tags);

    // User Growth Analytics
    const userGrowthStats = await db
      .select({
        totalUsers: sql<number>`count(distinct ${profiles.id})`,
        newUsersThisWeek: sql<number>`count(distinct case 
          when ${profiles.created_at} > now() - interval '7 days' 
          then ${profiles.id} end)`,
        newUsersThisMonth: sql<number>`count(distinct case 
          when ${profiles.created_at} > now() - interval '30 days' 
          then ${profiles.id} end)`,
      })
      .from(profiles);

    // Category Distribution
    const categoryStats = await db
      .select({
        category: projects.category,
        count: sql<number>`count(*)`,
      })
      .from(projects)
      .where(isNull(projects.deleted_at))
      .groupBy(projects.category)
      .orderBy(desc(sql<number>`count(*)`));

    const totalProjects = Number(projectStats[0]?.total || 0);
    const categoryDistribution = categoryStats.map(cat => ({
      category: cat.category,
      count: Number(cat.count),
      percentage: totalProjects > 0 ? Math.round((Number(cat.count) / totalProjects) * 100) : 0,
    }));

    // Engagement Metrics
    const engagementStats = await db
      .select({
        avgFavorites: sql<number>`coalesce(avg(${projects.total_favorites}), 0)`,
        projectsWithoutFavorites: sql<number>`count(case when coalesce(${projects.total_favorites}, 0) = 0 then 1 end)`,
      })
      .from(projects)
      .where(isNull(projects.deleted_at));

    // Calculate average tags per project
    const projectTagCounts = await db
      .select({
        project_id: projects.id,
        tag_count: sql<number>`count(${project_tags.tag_id})`,
      })
      .from(projects)
      .leftJoin(project_tags, eq(project_tags.project_id, projects.id))
      .where(isNull(projects.deleted_at))
      .groupBy(projects.id);

    const totalProjectCount = projectTagCounts.length;
    const totalTagCount = projectTagCounts.reduce((sum, p) => sum + Number(p.tag_count), 0);
    const projectsWithoutTagsCount = projectTagCounts.filter(p => Number(p.tag_count) === 0).length;
    const avgTags = totalProjectCount > 0 ? totalTagCount / totalProjectCount : 0;

    return {
      totalProjects,
      activeUsers: Number(activeUsers[0]?.count || 0),
      recentActivity: recentActivity.map(activity => ({
        ...activity,
        timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date()
      })),
      projectsNeedingAttention,
      mostPopularProjects,
      projectStats: {
        totalFavorites: Number(projectStats[0]?.totalFavorites || 0),
        totalTags: Number(tagStats[0]?.total || 0),
        activeThisWeek: Number(projectStats[0]?.activeThisWeek || 0),
      },
      topTags: topTags.map(tag => ({
        name: tag.name,
        count: Number(tag.count || 0)
      })),
      allProjects,
      userGrowth: {
        totalUsers: Number(userGrowthStats[0]?.totalUsers || 0),
        newUsersThisWeek: Number(userGrowthStats[0]?.newUsersThisWeek || 0),
        newUsersThisMonth: Number(userGrowthStats[0]?.newUsersThisMonth || 0),
      },
      categoryDistribution,
      engagementMetrics: {
        avgFavoritesPerProject: Math.round(Number(engagementStats[0]?.avgFavorites || 0) * 10) / 10,
        avgTagsPerProject: Math.round(avgTags * 10) / 10,
        projectsWithoutFavorites: Number(engagementStats[0]?.projectsWithoutFavorites || 0),
        projectsWithoutTags: projectsWithoutTagsCount,
      },
    };
  });
}