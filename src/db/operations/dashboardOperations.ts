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
  activeProjects: {
    id: string;
    title: string;
    description: string | null;
    progress: number;
    owner: string;
    total_favorites: number;
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
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return executeQuery(async (db) => {
    // Get total projects and activity stats in a single query
    const projectStats = await db
      .select({
        total: sql<number>`count(distinct ${projects.id})`,
        activeThisWeek: sql<number>`count(distinct case when ${projects.updated_at} > now() - interval '7 days' then ${projects.id} end)`,
        totalFavorites: sql<number>`coalesce(sum(${projects.total_favorites}), 0)`,
      })
      .from(projects)
      .where(isNull(projects.deleted_at));

    // Get active users (users with activity in last 7 days)
    const activeUsers = await db
      .select({
        count: sql<number>`count(distinct ${profiles.id})`,
      })
      .from(profiles)
      .innerJoin(projects, eq(projects.user_id, profiles.user_id))
      .where(sql`${projects.updated_at} > now() - interval '7 days'`);

    // Get recent activity with proper null handling
    const recentActivity = await db
      .select({
        id: projects.id,
        title: projects.title,
        action: sql<string>`case when ${projects.created_at} = ${projects.updated_at} then 'created' else 'updated' end`,
        username: sql<string>`coalesce(${profiles.username}, 'Unknown User')`,
        timestamp: projects.updated_at,
      })
      .from(projects)
      .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
      .where(isNull(projects.deleted_at))
      .orderBy(desc(projects.updated_at))
      .limit(5);

    // Get active projects with progress calculation
    const activeProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        owner: sql<string>`coalesce(${profiles.username}, 'Unknown User')`,
        total_favorites: sql<number>`coalesce(${projects.total_favorites}, 0)`,
        progress: sql<number>`
          (
            CASE 
              WHEN ${projects.description} IS NOT NULL AND length(${projects.description}) > 0 THEN 40
              ELSE 0
            END +
            CASE 
              WHEN EXISTS (
                SELECT 1 FROM ${project_tags} 
                WHERE ${project_tags.project_id} = ${projects.id}
                LIMIT 1
              ) THEN 30
              ELSE 0
            END +
            CASE 
              WHEN coalesce(${projects.total_favorites}, 0) > 0 THEN 20
              ELSE 0
            END +
            CASE 
              WHEN ${projects.category} != 'web' THEN 10
              ELSE 0
            END
          )::numeric
        `,
      })
      .from(projects)
      .leftJoin(profiles, eq(profiles.user_id, projects.user_id))
      .where(isNull(projects.deleted_at))
      .orderBy(desc(projects.updated_at))
      .limit(4);

    // Get most popular projects with null handling
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

    // Get top tags with proper counting
    const topTags = await db
      .select({
        name: tags.name,
        count: sql<number>`count(${project_tags.project_id})`,
      })
      .from(tags)
      .leftJoin(project_tags, eq(project_tags.tag_id, tags.id))
      .groupBy(tags.id, tags.name)
      .orderBy(desc(sql<number>`count(${project_tags.project_id})`))
      .limit(10);

    // Count total tags
    const tagStats = await db
      .select({
        total: sql<number>`count(distinct ${tags.id})`,
      })
      .from(tags);

    return {
      totalProjects: Number(projectStats[0]?.total || 0),
      activeUsers: Number(activeUsers[0]?.count || 0),
      recentActivity: recentActivity.map(activity => ({
        ...activity,
        timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date()
      })),
      activeProjects: activeProjects.map(project => ({
        ...project,
        description: project.description || "No description provided"
      })),
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
    };
  });
}