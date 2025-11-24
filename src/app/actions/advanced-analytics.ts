'use server';

import { executeQuery } from "@/db/server";
import { sql, desc, eq, and, isNull, gte } from "drizzle-orm";
import { projects } from "@/db/schema/projects";
import { profiles } from "@/db/schema/profiles";
import { favorites } from "@/db/schema/favorites";
import { tag_submissions } from "@/db/schema/tag_submissions";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin-utils";
import { redirect } from "next/navigation";
import { unstable_cache } from 'next/cache';

export interface TopContributor {
  user_id: string;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  tier: string | null;
  projects_count: number;
  favorites_received: number;
  tag_submissions_count: number;
  approved_tags_count: number;
  contribution_score: number;
}

export interface TagPipelineMetrics {
  totalSubmissions: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  approvalRate: number;
  rejectionRate: number;
  avgReviewTimeHours: number | null;
  submissionsByStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  recentSubmissions: {
    id: string;
    tag_name: string;
    submitter_email: string;
    status: string;
    created_at: Date;
    reviewed_at: Date | null;
    review_time_hours: number | null;
  }[];
  topSubmitters: {
    submitter_email: string;
    total_submissions: number;
    approved: number;
    pending: number;
    rejected: number;
    approval_rate: number;
  }[];
}

async function checkAdminAccess() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized: User not logged in");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const userEmail = user.emailAddresses[0]?.emailAddress;

  if (!isAdmin(userEmail)) {
    redirect("/dashboard");
  }
}

// Cached version of top contributors query
export const getCachedTopContributors = unstable_cache(
  async (limit: number) => {
    return executeQuery(async (db) => {
      // Get comprehensive contributor stats
      const contributors = await db
        .select({
          user_id: profiles.user_id,
          username: profiles.username,
          full_name: profiles.full_name,
          profile_image_url: profiles.profile_image_url,
          tier: profiles.tier,
          projects_count: sql<number>`count(distinct ${projects.id})`,
          favorites_received: sql<number>`coalesce(sum(${projects.total_favorites}), 0)`,
          tag_submissions_count: sql<number>`(
            SELECT count(*)
            FROM ${tag_submissions}
            WHERE ${tag_submissions.submitter_email} = ${profiles.email_address}
          )`,
          approved_tags_count: sql<number>`(
            SELECT count(*)
            FROM ${tag_submissions}
            WHERE ${tag_submissions.submitter_email} = ${profiles.email_address}
            AND ${tag_submissions.status} = 'approved'
          )`,
        })
        .from(profiles)
        .leftJoin(projects, eq(projects.user_id, profiles.user_id))
        .where(isNull(projects.deleted_at))
        .groupBy(
          profiles.id,
          profiles.user_id,
          profiles.username,
          profiles.full_name,
          profiles.profile_image_url,
          profiles.tier,
          profiles.email_address
        )
        .orderBy(desc(sql<number>`count(distinct ${projects.id})`));

      // Calculate contribution score for each user
      const scoredContributors = contributors.map(contributor => {
        const projectsCount = Number(contributor.projects_count || 0);
        const favoritesReceived = Number(contributor.favorites_received || 0);
        const approvedTagsCount = Number(contributor.approved_tags_count || 0);
        
        const contributionScore = 
          (projectsCount * 10) + 
          (favoritesReceived * 5) + 
          (approvedTagsCount * 5);

        return {
          user_id: contributor.user_id,
          username: contributor.username,
          full_name: contributor.full_name,
          profile_image_url: contributor.profile_image_url,
          tier: contributor.tier,
          projects_count: projectsCount,
          favorites_received: favoritesReceived,
          tag_submissions_count: Number(contributor.tag_submissions_count || 0),
          approved_tags_count: approvedTagsCount,
          contribution_score: contributionScore,
        };
      });

      return scoredContributors
        .sort((a, b) => b.contribution_score - a.contribution_score)
        .slice(0, limit);
    });
  },
  ['top-contributors'],
  {
    revalidate: 300, // 5 minutes
    tags: ['admin-dashboard', 'contributors']
  }
);

// Cached version of tag pipeline analytics
export const getCachedTagPipelineAnalytics = unstable_cache(
  async () => {
    return executeQuery(async (db) => {
      // ... all the tag pipeline logic
      const overallStats = await db
        .select({
          totalSubmissions: sql<number>`count(*)`,
          pendingCount: sql<number>`count(case when ${tag_submissions.status} = 'pending' then 1 end)`,
          approvedCount: sql<number>`count(case when ${tag_submissions.status} = 'approved' then 1 end)`,
          rejectedCount: sql<number>`count(case when ${tag_submissions.status} = 'rejected' then 1 end)`,
          avgReviewTimeHours: sql<number>`avg(
            case 
              when ${tag_submissions.reviewed_at} is not null 
              then extract(epoch from (${tag_submissions.reviewed_at} - ${tag_submissions.created_at})) / 3600
              else null 
            end
          )`,
        })
        .from(tag_submissions);

      const stats = overallStats[0];
      const totalSubmissions = Number(stats?.totalSubmissions || 0);
      const pendingCount = Number(stats?.pendingCount || 0);
      const approvedCount = Number(stats?.approvedCount || 0);
      const rejectedCount = Number(stats?.rejectedCount || 0);

      const approvalRate = totalSubmissions > 0 
        ? Math.round((approvedCount / totalSubmissions) * 100) 
        : 0;
      
      const rejectionRate = totalSubmissions > 0 
        ? Math.round((rejectedCount / totalSubmissions) * 100) 
        : 0;

      const submissionsByStatus = [
        { status: 'pending', count: pendingCount, percentage: totalSubmissions > 0 ? Math.round((pendingCount / totalSubmissions) * 100) : 0 },
        { status: 'approved', count: approvedCount, percentage: totalSubmissions > 0 ? Math.round((approvedCount / totalSubmissions) * 100) : 0 },
        { status: 'rejected', count: rejectedCount, percentage: totalSubmissions > 0 ? Math.round((rejectedCount / totalSubmissions) * 100) : 0 },
      ];

      const recentSubmissionsQuery = await db
        .select({
          id: tag_submissions.id,
          tag_name: tag_submissions.tag_name,
          submitter_email: tag_submissions.submitter_email,
          status: tag_submissions.status,
          created_at: tag_submissions.created_at,
          reviewed_at: tag_submissions.reviewed_at,
          review_time_hours: sql<number>`
            case 
              when ${tag_submissions.reviewed_at} is not null 
              then extract(epoch from (${tag_submissions.reviewed_at} - ${tag_submissions.created_at})) / 3600
              else null 
            end
          `,
        })
        .from(tag_submissions)
        .orderBy(desc(tag_submissions.created_at))
        .limit(50);

      const recentSubmissions = recentSubmissionsQuery.map(sub => ({
        id: sub.id,
        tag_name: sub.tag_name,
        submitter_email: sub.submitter_email,
        status: sub.status,
        created_at: sub.created_at ? new Date(sub.created_at) : new Date(),
        reviewed_at: sub.reviewed_at ? new Date(sub.reviewed_at) : null,
        review_time_hours: sub.review_time_hours !== null ? Math.round(Number(sub.review_time_hours) * 10) / 10 : null,
      }));

      const topSubmittersQuery = await db
        .select({
          submitter_email: tag_submissions.submitter_email,
          total_submissions: sql<number>`count(*)`,
          approved: sql<number>`count(case when ${tag_submissions.status} = 'approved' then 1 end)`,
          pending: sql<number>`count(case when ${tag_submissions.status} = 'pending' then 1 end)`,
          rejected: sql<number>`count(case when ${tag_submissions.status} = 'rejected' then 1 end)`,
        })
        .from(tag_submissions)
        .groupBy(tag_submissions.submitter_email)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(10);

      const topSubmitters = topSubmittersQuery.map(submitter => {
        const totalSubs = Number(submitter.total_submissions || 0);
        const approvedSubs = Number(submitter.approved || 0);
        
        return {
          submitter_email: submitter.submitter_email,
          total_submissions: totalSubs,
          approved: approvedSubs,
          pending: Number(submitter.pending || 0),
          rejected: Number(submitter.rejected || 0),
          approval_rate: totalSubs > 0 ? Math.round((approvedSubs / totalSubs) * 100) : 0,
        };
      });

      return {
        totalSubmissions,
        pendingCount,
        approvedCount,
        rejectedCount,
        approvalRate,
        rejectionRate,
        avgReviewTimeHours: stats?.avgReviewTimeHours !== null 
          ? Math.round(Number(stats.avgReviewTimeHours) * 10) / 10 
          : null,
        submissionsByStatus,
        recentSubmissions,
        topSubmitters,
      };
    });
  },
  ['tag-pipeline-analytics'],
  {
    revalidate: 120, // 2 minutes
    tags: ['admin-dashboard', 'tag-submissions']
  }
);

export async function fetchTopContributors(limit: number = 20): Promise<TopContributor[]> {
  await checkAdminAccess();
  return getCachedTopContributors(limit);
}

// Public version for user list - excludes tag metrics to prevent spam
export async function fetchTopContributorsPublic(limit: number = 20): Promise<TopContributor[]> {
  return executeQuery(async (db) => {
    // Get contributor stats without tag submissions (public view)
    const contributors = await db
      .select({
        user_id: profiles.user_id,
        username: profiles.username,
        full_name: profiles.full_name,
        profile_image_url: profiles.profile_image_url,
        tier: profiles.tier,
        projects_count: sql<number>`count(distinct ${projects.id})`,
        favorites_received: sql<number>`coalesce(sum(${projects.total_favorites}), 0)`,
      })
      .from(profiles)
      .leftJoin(projects, eq(projects.user_id, profiles.user_id))
      .where(isNull(projects.deleted_at))
      .groupBy(
        profiles.id,
        profiles.user_id,
        profiles.username,
        profiles.full_name,
        profiles.profile_image_url,
        profiles.tier
      )
      .orderBy(desc(sql<number>`count(distinct ${projects.id})`));

    // Calculate contribution score for public view
    // Score = (projects * 10) + (favorites_received * 5)
    // No tags to avoid spam incentive
    const scoredContributors = contributors.map(contributor => {
      const projectsCount = Number(contributor.projects_count || 0);
      const favoritesReceived = Number(contributor.favorites_received || 0);
      
      const contributionScore = 
        (projectsCount * 10) + 
        (favoritesReceived * 5);

      return {
        user_id: contributor.user_id,
        username: contributor.username,
        full_name: contributor.full_name,
        profile_image_url: contributor.profile_image_url,
        tier: contributor.tier,
        projects_count: projectsCount,
        favorites_received: favoritesReceived,
        tag_submissions_count: 0, // Not included in public view
        approved_tags_count: 0,    // Not included in public view
        contribution_score: contributionScore,
      };
    });

    // Sort by contribution score and return top contributors
    return scoredContributors
      .sort((a, b) => b.contribution_score - a.contribution_score)
      .slice(0, limit);
  });
}

export async function fetchTagPipelineAnalytics(): Promise<TagPipelineMetrics> {
  await checkAdminAccess();
  return getCachedTagPipelineAnalytics();
}
