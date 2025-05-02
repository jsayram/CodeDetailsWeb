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
import { LogIn } from "lucide-react";
import {
  SelectProjectWithOwner,
  SelectUserWithProject,
} from "@/db/schema/projects";
import { PageBanner } from "@/components/ui/page-banner";
import { HeaderSectionNoSideBar } from "@/components/layout/HeaderSectionNoSideBar";

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
        <FooterSection />
      </SidebarInset>
    </SidebarProvider>
  );
}
