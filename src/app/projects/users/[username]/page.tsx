"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { ProjectsProvider } from "@/providers/projects-provider";
import { ProjectList } from "@/components/Projects";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { useState, use } from "react";
import { CURRENT_PAGE } from "@/components/navigation/Pagination/paginationConstants";
import { PageBanner } from "@/components/ui/page-banner";
import { User, LogIn } from "lucide-react";
import { SelectProfile } from "@/db/schema/profiles";
import { useEffect } from "react";
import { UserProfileLoadingState } from "@/components/LoadingState/UserProfileLoadingState";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";
import { capitalizeNames } from "@/utils/stringUtils";

interface PageProps {
  params: Promise<{ username: string }> | { username: string };
}

export default function UserProjectsPage({ params }: PageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const { user, isLoaded: userLoaded } = useUser();
  const { token, loading: tokenLoading } = useSupabaseToken();
  const [currentPage, setCurrentPage] = useState(CURRENT_PAGE);
  const [profileData, setProfileData] = useState<SelectProfile | null>(null);

  // derive the decoded username from route params immediately
  const decodedUsername = resolvedParams.username
    ? decodeURIComponent(resolvedParams.username)
    : "";

  // fetch profile data when decodedUsername changes
  useEffect(() => {
    if (!decodedUsername) return;
    fetch(`/api/profiles/${encodeURIComponent(decodedUsername)}`)
      .then((res) => res.json())
      .then((data) => data.profile && setProfileData(data.profile))
      .catch((err) => console.error("Error fetching profile:", err));
  }, [decodedUsername]);

  // Only consider loading if we're waiting for auth-related data AND we don't have profile data yet
  const isLoading = (!userLoaded || tokenLoading) && !profileData;

  return (
    <>
      {isLoading ? (
        <div className="container mx-auto px-4 py-8">
          <UserProfileLoadingState />
        </div>
      ) : (
        <ProjectsProvider
          token={token}
          userId={user?.id ?? null}
          isLoading={isLoading}
          initialFilters={{
            username: decodedUsername,
            showAll: false,
            page: currentPage,
            limit: 10,
          }}
        >
          <SidebarProvider>
            <SignedIn>
              <AppSidebar />
            </SignedIn>
            <SidebarInset>
              <HeaderSection />
              <div className="container mx-auto px-4">
                <div className="flex justify-center w-full mb-20">
                  <div className="w-full max-w-7xl">
                    <div className="flex flex-col gap-4 mb-6 py-3">
                      <PageBanner
                        icon={<User className="h-8 w-8 text-primary" />}
                        userName={
                          profileData?.full_name
                            ? capitalizeNames(profileData.full_name)
                            : profileData?.username ||
                              decodedUsername ||
                              "Anonymous User"
                        }
                        bannerTitle="Projects Showcase"
                        description={
                          profileData?.full_name
                            ? `Browse all projects by ${profileData.username}`
                            : "Browse user's projects"
                        }
                        isUserBanner={true}
                        gradientFrom="indigo-900"
                        gradientTo="indigo-950"
                        borderColor="border-indigo-800"
                        textGradient="from-indigo-200 via-indigo-300 to-indigo-200"
                      />
                    </div>
                    <ProjectList
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </ProjectsProvider>
      )}
      <FooterSection />
    </>
  );
}
