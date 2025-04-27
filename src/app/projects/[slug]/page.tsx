import { Suspense } from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { ProjectListLoadingState } from "@/components/LoadingState/ProjectListLoadingState";
import { getProjectBySlugServer } from "@/db/actions";
import { ProjectContent } from "@/components/Projects/ProjectContent";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function ProjectPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> | { slug: string } 
}) {
  // Ensure params is handled as a Promise
  const resolvedParams = await Promise.resolve(params);
  const project = await getProjectBySlugServer(resolvedParams.slug);
  
  if (!project) {
    notFound();
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderSection />
        <Suspense fallback={
          <div className="container mx-auto px-4 py-8">
            <ProjectListLoadingState />
          </div>
        }>
          <ProjectContent project={project} error={undefined} />
        </Suspense>
        <FooterSection />
      </SidebarInset>
    </SidebarProvider>
  );
}