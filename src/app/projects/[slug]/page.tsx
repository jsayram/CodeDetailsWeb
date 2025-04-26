"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types/models/project";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { API_ROUTES } from "@/constants/api-routes";
import { ProjectListLoadingState } from "@/components/LoadingState/ProjectListLoadingState";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Calendar, User, Clock, Tags } from "lucide-react";
import { FormattedDate } from "@/lib/FormattedDate";
import { Separator } from "@/components/ui/separator";

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useSupabaseToken();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(API_ROUTES.PROJECTS.BY_SLUG(resolvedParams.slug));
        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Failed to load project");
          return;
        }

        setProject(data.data);
      } catch (err) {
        setError("An error occurred while fetching the project");
      } finally {
        setLoading(false);
      }
    };

    if (resolvedParams.slug) {
      fetchProject();
    }
  }, [resolvedParams.slug, token]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProjectListLoadingState />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
              <p className="text-muted-foreground">
                {error || "Project not found"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = project.profile?.full_name || 
                     project.profile?.username?.split('@')[0] || 
                     "Anonymous User";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderSection />
        <div className="container mx-auto px-4 py-8">
          {/* Profile Header Section */}
          <div className="mb-6 bg-card rounded-lg p-6 shadow-lg">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-background">
                {project.profile?.profile_image_url ? (
                  <AvatarImage
                    src={project.profile.profile_image_url}
                    alt={displayName}
                  />
                ) : (
                  <AvatarFallback className="text-2xl">
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">{project.title}</h1>
                    <p className="text-muted-foreground">by {displayName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {PROJECT_CATEGORIES[project.category]?.label || project.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Heart className="h-5 w-5" />
                      <span>{project.total_favorites || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About This Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-lg">{project.description || "No description provided"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-muted-foreground">
                          {project.created_at && <FormattedDate date={project.created_at} />}
                          {!project.created_at && <span>No date available</span>}
                        </p>
                      </div>
                    </div>
                    {project.updated_at && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Last Updated</p>
                          <p className="text-muted-foreground">
                            <FormattedDate date={project.updated_at} />
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tags Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Tags className="h-5 w-5" />
                    <CardTitle>Tags</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.tags && project.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No tags added</p>
                  )}
                </CardContent>
              </Card>

              {/* Project Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Category</p>
                      <p className="text-muted-foreground">
                        {PROJECT_CATEGORIES[project.category]?.description || project.category}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium">Engagement</p>
                      <p className="text-muted-foreground">
                        {project.total_favorites || 0} favorites
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <FooterSection />
      </SidebarInset>
    </SidebarProvider>
  );
}