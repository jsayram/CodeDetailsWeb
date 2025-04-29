"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Calendar, User, Clock, Tags } from "lucide-react";
import { FormattedDate } from "@/lib/FormattedDate";
import { Separator } from "@/components/ui/separator";
import { SelectProject } from "@/db/schema/projects";

interface UserProfile extends SelectProject {
  user_id: string;
  username: string;
  full_name: string;
  profile_image_url: string;
  tier: string;
  email_address: string;
  created_at: Date;
  updated_at: Date;
}

interface ProjectContentProps {
  project: SelectProject | null;
  error?: string;
  userProfile? : UserProfile | null;
}

export function ProjectContent({ project, error, userProfile }: ProjectContentProps): React.ReactElement {
  if (!project || !userProfile || error) {
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

  const displayName = userProfile?.full_name || 
                     userProfile?.username.split('@')[0] || 
                     "Anonymous User";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header Section */}
      <div className="mb-6 bg-card rounded-lg p-6 shadow-lg">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24 border-4 border-background">
            {userProfile?.profile_image_url ? (
              <AvatarImage
                src={userProfile?.profile_image_url}
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
                  {PROJECT_CATEGORIES[project.category as keyof typeof PROJECT_CATEGORIES]?.label || project.category}
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
                    {PROJECT_CATEGORIES[project.category as keyof typeof PROJECT_CATEGORIES]?.description || project.category}
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
  );
}