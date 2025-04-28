"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { ProjectsProvider } from "@/providers/projects-provider";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { PageBanner } from "@/components/ui/page-banner";
import { Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTagCache } from "@/hooks/use-tag-cache";
import { useRouter } from "next/navigation";

export default function TagsIndexPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { token, loading: tokenLoading } = useSupabaseToken();
  const router = useRouter();
  const { tags: allTags, isLoading: tagsLoading } = useTagCache();

  // Sort tags by usage count if available, otherwise alphabetically
  const sortedTags = [...(allTags || [])].sort((a, b) => {
    if (a.count !== b.count) {
      return (b.count || 0) - (a.count || 0);
    }
    return a.name.localeCompare(b.name);
  });

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
                  icon={<Tag className="h-8 w-8 text-primary" />}
                  bannerTitle="Project Tags"
                  description="Browse projects by tags"
                  isUserBanner={false}
                  gradientFrom="indigo-900"
                  gradientVia="blue-800"
                  gradientTo="purple-800"
                  borderColor="border-indigo-700/40"
                  textGradient="from-fuchsia-400 via-indigo-400 to-cyan-400"
                />

                <Card>
                  <CardHeader>
                    <CardTitle>All Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tagsLoading ? (
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="h-8 w-24 animate-pulse rounded-full bg-muted"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {sortedTags.map((tag) => (
                          <Badge
                            key={tag.name}
                            variant="secondary"
                            className={`text-base py-2 ${
                              (tag.count ?? 0) > 0 
                                ? 'cursor-pointer hover:bg-accent' 
                                : 'opacity-50 select-none'
                            }`}
                            onClick={(tag.count ?? 0) > 0 ? () => router.push(`/tags/${encodeURIComponent(tag.name)}`) : undefined}
                          >
                            #{tag.name}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({tag.count ?? 0})
                            </span>
                          </Badge>
                        ))}
                      </div>
                    )}
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