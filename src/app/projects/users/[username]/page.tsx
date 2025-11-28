"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SignedIn, SignedOut, SignIn, useUser } from "@clerk/nextjs";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { ProjectsProvider } from "@/providers/projects-provider";
import { ProjectList } from "@/components/Projects";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { useState, use } from "react";
import { CURRENT_PAGE } from "@/components/navigation/Pagination/paginationConstants";
import { PageBanner } from "@/components/ui/page-banner";
import { User } from "lucide-react";
import { SelectProfile } from "@/db/schema/profiles";
import { useEffect } from "react";
import { UserProfileLoadingState } from "@/components/LoadingState/UserProfileLoadingState";
import { capitalizeNames } from "@/utils/stringUtils";
import { toast } from "sonner";
import Image from "next/image";
import { TerminalWindowSection } from "@/components/layout/TerminalWindowSection";
import { CodeParticlesElement } from "@/components/Elements/CodeParticlesElement";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ username: string }> | { username: string };
}

export default function UserProjectsPage({ params }: PageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const { user, isLoaded: userLoaded } = useUser();
  const { token, loading: tokenLoading } = useSupabaseToken();
  const [currentPage, setCurrentPage] = useState(CURRENT_PAGE);
  const [profileData, setProfileData] = useState<SelectProfile | null>(null);
  const router = useRouter();

  // derive the decoded username from route params immediately
  const decodedUsername = resolvedParams.username
    ? decodeURIComponent(resolvedParams.username)
    : "";

  // Derive a trimmed username (everything before "@") if available
  const trimmedUsername = profileData?.username
    ? profileData.username.split("@")[0]
    : decodedUsername;

  // fetch profile data when decodedUsername changes
  useEffect(() => {
    if (!decodedUsername) return;

    const fetchProfile = async () => {
      try {
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
        const response = await fetch(
          `/api/profiles/${encodeURIComponent(decodedUsername)}`
        );

        // Check if response is OK and content-type is JSON
        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType?.includes("application/json")) {
          console.error("Invalid response:", response.status);
          return;
        }

        // Safely parse JSON
        const result = await response.json();
        
        // Check if this is a redirect response (old username was used)
        if (result.success && result.data?.redirect && result.data?.currentUsername) {
          router.replace(`/projects/users/${encodeURIComponent(result.data.currentUsername)}`);\n          return;
        }
        
        if (result.success && result.data?.profile) {
          setProfileData(result.data.profile);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [decodedUsername, user, router]);

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
              <SignedIn>
                <HeaderSection />
              </SignedIn>
              <SignedOut>
                <HeaderSection showMobileMenu={false} />
              </SignedOut>
              <SignedIn>
                <div className="container mx-auto px-4">
                  <div className="flex justify-center w-full mb-20">
                    <div className="w-full px-4 2xl:px-8 3xl:px-12">
                      <div className="flex flex-col gap-4 mb-6 py-3">
                        <PageBanner
                          icon={<User className="h-8 w-8 text-primary" />}
                          userName={
                            profileData?.full_name
                              ? capitalizeNames(profileData.full_name)
                              : trimmedUsername ||
                                decodedUsername ||
                                "Anonymous User"
                          }
                          bannerTitle="Projects Showcase"
                          description={
                            profileData?.full_name
                              ? `Browse all projects by ${trimmedUsername}`
                              : "Browse user's projects"
                          }
                          isUserBanner={true}
                          gradientFrom="indigo-900"
                          gradientVia="blue-800"
                          gradientTo="purple-800"
                          tierBgColor="bg-indigo-700/60"
                          textGradient="from-fuchsia-400 via-indigo-400 to-cyan-400"
                        />
                      </div>
                      <ProjectList
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  </div>
                </div>
              </SignedIn>
              <SignedOut>
                <div className="container mx-auto h-full px-4 py-8 mt-30 ">
                  <div className="flex justify-center w-full">
                    <div className="w-full max-w-3xl text-center">
                      <CodeParticlesElement />
                      <div className="flex flex-col items-center gap-6 p-8">
                        <div className="relative mb-8">
                          <div className="bg-card/90 rounded-2xl p-6 shadow-lg relative border border-white/20">
                            <h1 className="text-2xl font-bold text-foreground mb-4">
                              Authentication Required To View User Profiles
                            </h1>
                            <TerminalWindowSection
                              unauthenticatedMessage="Please sign in to view user profiles and their projects"
                              width="w-full lg:w-[500px] xl:w-[500px]"
                              height="h-[200px] lg:h-[200px] xl:h-[200px]"
                              showDatetime={false}
                            />
                            <p className="text-muted-foreground mt-4">
                              You need to be signed in to view user profiles and
                              their projects.
                            </p>
                            {/* Larger triangle with white border effect */}
                            <div
                              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0 h-0 
                              border-l-[16px] border-l-transparent
                              border-t-[24px] border-t-white/20
                              border-r-[16px] border-r-transparent"
                            ></div>
                            <div
                              className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-0 h-0 
                              border-l-[16px] border-l-transparent
                              border-t-[24px] border-t-card/90
                              border-r-[16px] border-r-transparent"
                            ></div>
                          </div>
                        </div>

                        {/* Mascot Image */}
                        <div className="relative w-40 h-40 ">
                          <Image
                            src="/images/mascot.png"
                            alt="Code Minion"
                            width={600}
                            height={600}
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SignedOut>
            </SidebarInset>
          </SidebarProvider>
        </ProjectsProvider>
      )}
      <FooterSection />
    </>
  );
}
