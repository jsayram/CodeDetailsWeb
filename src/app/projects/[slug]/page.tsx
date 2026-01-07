import { Suspense } from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { ProjectListLoadingState } from "@/components/LoadingState/ProjectListLoadingState";
import {
  getProjectBySlugServer,
  getProjectUsersProfileBySlugServer,
} from "@/db/actions";
import { ProjectContent } from "@/components/Projects/ProjectComponents/ProjectContent";
import { notFound } from "next/navigation";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LogIn } from "lucide-react";
import {
  SelectProjectWithOwner,
  SelectUserWithProject,
} from "@/db/schema/projects";
import { PageBanner } from "@/components/ui/page-banner";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";
import { ProjectsProvider } from "@/providers/projects-provider";
import { cookies } from "next/headers";

type Props = {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  // Ensure params is handled as a Promise
  const resolvedParams = await Promise.resolve(params);
  
  // Get auth data first
  const { userId, sessionClaims } = await auth();
  const userEmail = sessionClaims?.email as string | undefined;
  
  const project = (await getProjectBySlugServer(
    resolvedParams.slug,
    userId,
    userEmail
  )) as SelectProjectWithOwner;
  const user = (await getProjectUsersProfileBySlugServer(
    resolvedParams.slug
  )) as SelectUserWithProject;
  const cookieStore = await cookies();
  const token = cookieStore.get("__supabase_auth_token")?.value || null;

  if (!project) {
    notFound();
  }

  return (
    <SidebarProvider>
      <SignedIn>
        <AppSidebar />
      </SignedIn>
      <SidebarInset>
        <SignedOut>
          <HeaderSectionNoSideBar showMobileMenu={false} />
        </SignedOut>
        <SignedIn>
          <HeaderSection />
        </SignedIn>
        <SignedOut>
          <div className="w-full max-w-[1920px] 4xl:max-w-none mx-auto px-4 2xl:px-8 3xl:px-12 mb-6 py-3">
            <PageBanner
              icon={<LogIn className="h-8 w-8 text-purple-500" />}
              userName={project.owner_full_name || "This creator"}
              bannerTitle={`You are viewing ${
                  project.owner_full_name || "This creator"
                }'s project.`}
              description={`Sign in to explore more of their projects and free content.`}
              isUserBanner={false}
              gradientFrom="purple-900"
              gradientVia="indigo-800"
              gradientTo="violet-800"
              borderColor="border-purple-700/40"
              tierBgColor="bg-purple-700/60"
              textGradient="from-purple-400 via-indigo-400 to-violet-400"
            />
          </div>
        </SignedOut>
        <ProjectsProvider token={token} userId={userId} isLoading={false}>
          <Suspense
            fallback={
              <div className="container mx-auto px-4 py-8">
                <ProjectListLoadingState />
              </div>
            }
          >
            <ProjectContent
              project={project}
              error={undefined}
              userProfile={user}
            />
          </Suspense>
        </ProjectsProvider>
        <FooterSection />
      </SidebarInset>
    </SidebarProvider>
  );
}
