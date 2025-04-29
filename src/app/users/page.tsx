"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { ProjectsProvider } from "@/providers/projects-provider";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { PageBanner } from "@/components/ui/page-banner";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserList } from "@/components/UserList";

export default function UsersIndexPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { token, loading: tokenLoading } = useSupabaseToken();

  return (
    <ProjectsProvider token={token} userId={user?.id ?? null}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderSection />
          <div className="flex justify-center w-full mb-20">
            <div className="w-full max-w-7xl px-4">
              <div className="flex flex-col gap-4 mb-6 py-3">
                <PageBanner
                  icon={<Users className="h-8 w-8 text-primary" />}
                  bannerTitle="Browse by Users"
                  description="Find projects by their creators"
                  isUserBanner={false}
                  gradientFrom="indigo-900"
                  gradientVia="blue-800"
                  gradientTo="purple-800"
                  borderColor="border-indigo-700/40"
                  textGradient="from-fuchsia-400 via-indigo-400 to-cyan-400"
                />

                <Card>
                  <CardHeader>
                    <CardTitle>All Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UserList />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </ProjectsProvider>
  );
}
