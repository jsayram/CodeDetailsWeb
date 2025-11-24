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
  const project = (await getProjectBySlugServer(
    resolvedParams.slug
  )) as SelectProjectWithOwner;
  const user = (await getProjectUsersProfileBySlugServer(
    resolvedParams.slug
  )) as SelectUserWithProject;

  // Get auth data
  const { userId } = await auth();
  // For server components, we'll use the JWT directly from cookies //TODO:NEED TO REVISIT THIS INCASE THERE AUTH IS NOT SET
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
        <div className="container mx-auto px-4">
          <SignedOut>
            <div className="mb-6">
              <PageBanner
                icon={<LogIn className="h-6 w-6 text-primary" />}
                bannerTitle={`You are viewing ${
                  project.owner_full_name || "this creator"
                }'s project.`}
                description={`Sign in to explore more of their projects and free content.`}
                isUserBanner={false}
                gradientFrom="primary/10"
                gradientTo="primary/5"
                borderColor="border-border"
                textGradient="from-primary via-primary to-primary"
              />
            </div>
          </SignedOut>
        </div>
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
