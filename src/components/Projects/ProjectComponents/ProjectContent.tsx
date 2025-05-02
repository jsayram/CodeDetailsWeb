"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Calendar, User, Clock, Tags, ArrowLeft } from "lucide-react";
import { FormattedDate } from "@/lib/FormattedDate";
import { Separator } from "@/components/ui/separator";
import { SelectProject } from "@/db/schema/projects";
import { toast } from "sonner";
import { useUser, useAuth, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";

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
  userProfile?: UserProfile | null;
}

export function ProjectContent({
  project,
  error,
  userProfile,
}: ProjectContentProps): React.ReactElement {
  const { user } = useUser();
  const router = useRouter();
  const [isNavigatingUser, setIsNavigatingUser] = useState(false);

  const handleNavigateUser = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.dismiss();
      toast.info(
        <div className="relative flex flex-row items-center gap-2">
          <Image
            src="/images/mascot.png"
            alt="Code Minion"
            width={50}
            height={50}
            className="relative rounded-md"
          />
          <p>You have to be logged in to view user profiles silly goose</p>
        </div>
      );

      return;
    }
    if (isNavigatingUser || !userProfile?.username) return;
    setIsNavigatingUser(true);
    router.push(`/users/${encodeURIComponent(userProfile.username)}`);
  };

  if (!project || !userProfile || error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive mb-2">
                Error
              </h2>
              <p className="text-muted-foreground">
                {error || "Project not found"}
              </p>
              <p className="text-muted-foreground">
                Please check the URL or sign in to view the project.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName =
    userProfile?.full_name ||
    userProfile?.username.split("@")[0] ||
    "Anonymous User";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header Section */}
      <div className="mb-6 bg-card rounded-lg p-6 shadow-lg">
        <div className="flex items-start gap-6">
          <button
            onClick={handleNavigateUser}
            disabled={isNavigatingUser}
            className={`relative ${
              isNavigatingUser
                ? "cursor-wait"
                : "cursor-pointer hover:opacity-80 transition-opacity"
            }`}
            aria-label="View user profile"
          >
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
            {isNavigatingUser && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <button
                  onClick={handleNavigateUser}
                  disabled={isNavigatingUser}
                  className={`text-muted-foreground ${
                    isNavigatingUser
                      ? "cursor-wait opacity-70"
                      : "hover:text-primary hover:underline cursor-pointer"
                  }`}
                >
                  by {displayName}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {PROJECT_CATEGORIES[
                    project.category as keyof typeof PROJECT_CATEGORIES
                  ]?.label || project.category}
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
                <p className="text-lg">
                  {project.description || "No description provided"}
                </p>
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
                      {project.created_at && (
                        <FormattedDate date={project.created_at} />
                      )}
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
                    {PROJECT_CATEGORIES[
                      project.category as keyof typeof PROJECT_CATEGORIES
                    ]?.description || project.category}
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
