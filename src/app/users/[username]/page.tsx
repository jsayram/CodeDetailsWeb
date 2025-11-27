"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { User, Heart, FolderKanban, Calendar } from "lucide-react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectProfile } from "@/db/schema/profiles";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ username: string }> | { username: string };
}

export default function UserProfilePage({ params }: PageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const username = decodeURIComponent(resolvedParams.username);
  const [profileData, setProfileData] = useState<SelectProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalTags: 0,
    totalProjects: 0,
    activeProjects: 0,
    graveyardProjects: 0,
    communityProjects: 0,
    projectsFavorited: 0,
    projectsReceivedFavorites: 0,
    mostLikedProject: { title: "", favorites: 0 },
    joinedDate: null as Date | null,
  });
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const handleProjectsClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(`/projects/users/${encodeURIComponent(username)}`);
  };

  useEffect(() => {
    if (username) {
      setIsLoading(true);
      // Fetch profile data
      const profilePromise = fetch(
        `/api/profiles/lookup/${encodeURIComponent(username)}`
      )
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch profile");
          }
          const data = await response.json();
          // Fetch profile with stats in a single request
          return fetch(
            `/api/profiles/by-id/${data.profile.user_id}?includeStats=true`
          );
        })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
            console.error("API Error:", errorData);
            throw new Error(errorData.error || "Failed to fetch profile stats");
          }
          return res.json();
        });

      profilePromise
        .then((data) => {
          if (data.profile) {
            setProfileData(data.profile);
          }
          if (data.stats) {
            setStats(data.stats);
          }
        })
        .catch((err) => console.error("Error fetching profile:", err))
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [username]);

  if (isLoading || !profileData) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderSection />
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Card Loading State */}
              <div className="md:col-span-1">
                <Card>
                  <CardContent className="space-y-4 p-6">
                    <div className="flex flex-col items-center">
                      <Skeleton className="h-24 w-24 rounded-full" />
                      <div className="space-y-2 mt-4 w-full text-center">
                        <Skeleton className="h-6 w-32 mx-auto" />
                        <Skeleton className="h-4 w-48 mx-auto" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stats Grid Loading State */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-28 mb-2" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Skeleton className="h-4 w-16 mb-2" />
                          <Skeleton className="h-6 w-48" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderSection />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-24 w-24">
                      {profileData?.profile_image_url ? (
                        <AvatarImage
                          src={profileData.profile_image_url}
                          alt={profileData.username}
                        />
                      ) : (
                        <AvatarFallback>
                          <User className="h-12 w-12" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="text-center mt-4">
                      <h2 className="text-xl font-semibold">
                        {profileData?.username || "Loading..."}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {profileData?.email_address}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Grid */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Public Stats - Visible to everyone */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FolderKanban className="h-5 w-5 text-primary" />
                      Active Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{stats.activeProjects}</div>
                    <p className="text-xs text-muted-foreground mt-1">Public projects</p>
                    <Button
                      className="mt-3 w-full bg-primary hover:bg-primary/90 cursor-pointer"
                      onClick={handleProjectsClick}
                    >
                      View Projects →
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Heart className="h-5 w-5 text-primary" />
                      Favorites Given
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{stats.projectsFavorited}</div>
                    <p className="text-xs text-muted-foreground mt-1">Projects favorited</p>
                  </CardContent>
                </Card>

                {stats.joinedDate && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-5 w-5 text-primary" />
                        Member Since
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-semibold">
                        {new Date(stats.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.floor((Date.now() - new Date(stats.joinedDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
        <FooterSection />
      </SidebarInset>
    </SidebarProvider>
  );
}
