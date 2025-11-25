"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { ProjectsProvider } from "@/providers/projects-provider";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { PageBanner } from "@/components/ui/page-banner";
import { Tag, Hash, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTagCache } from "@/hooks/use-tag-cache";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { HighlightText } from "@/components/HighlightText";

export default function TagsIndexPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { token, loading: tokenLoading } = useSupabaseToken();
  const router = useRouter();
  const { tags: allTags, isLoading: tagsLoading } = useTagCache();
  const [searchQuery, setSearchQuery] = useState("");
  const [clickedTag, setClickedTag] = useState<string | null>(null);

  // Filter and sort tags
  const filteredTags = (allTags || [])
    .filter((tag) => {
      const searchLower = searchQuery.toLowerCase().trim();
      if (!searchLower) return true;
      return tag.name.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      if (a.count !== b.count) {
        return (b.count || 0) - (a.count || 0);
      }
      return a.name.localeCompare(b.name);
    });

  // Separate active and inactive tags
  const activeTags = filteredTags.filter((tag) => (tag.count ?? 0) > 0);
  const inactiveTags = filteredTags.filter((tag) => !tag.count || tag.count === 0);

  const handleTagClick = (tagName: string) => {
    setClickedTag(tagName);
    router.push(`/tags/${encodeURIComponent(tagName)}`);
  };

  // Define fixed widths for skeletons to prevent hydration mismatches
  const activeTagWidths = [120, 108, 106, 123, 92, 119, 119, 138];
  const inactiveTagWidths = [78, 72, 80, 80, 87, 88];

  // Show loading state while tags are loading
  if (tagsLoading) {
    return (
      <ProjectsProvider token={token} userId={user?.id ?? null}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <HeaderSection />
            <div className="flex justify-center w-full mb-20">
              <div className="w-full px-4 2xl:px-8 3xl:px-12">
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

                  <div className="space-y-6">
                    {/* Search Input Skeleton */}
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <div className="h-10 bg-muted rounded-md w-64 animate-pulse"></div>
                    </div>

                    {/* Active Tags Section Skeleton */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span>Active Tags</span>
                          <div className="h-6 w-8 bg-muted rounded-full animate-pulse"></div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {activeTagWidths.map((width, i) => (
                            <div
                              key={i}
                              className="h-8 bg-muted rounded-full animate-pulse"
                              style={{
                                width: `${width}px`,
                                animationDelay: `${(i + 1) * 100}ms`
                              }}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Inactive Tags Section Skeleton */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-muted-foreground">Available Tags</span>
                          <div className="h-6 w-8 bg-muted rounded-full animate-pulse"></div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {inactiveTagWidths.map((width, i) => (
                            <div
                              key={i}
                              className="h-8 bg-muted/50 rounded-full animate-pulse"
                              style={{
                                width: `${width}px`,
                                animationDelay: `${(i + 1) * 100}ms`
                              }}
                            />
                          ))}
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
      </ProjectsProvider>
    );
  }

  return (
    <ProjectsProvider token={token} userId={user?.id ?? null}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderSection />
          <div className="flex justify-center w-full mb-20">
            <div className="w-full px-4 2xl:px-8 3xl:px-12">
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

                <div className="space-y-6">
                  {/* Search Input */}
                  <div className="relative max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200" />
                    <Input
                      type="search"
                      placeholder="Search tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 text-base rounded-xl border-2 border-primary/20 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-md transition-all duration-200"
                    />
                  </div>

                  {/* Active Tags Section */}
                  {(searchQuery || activeTags.length > 0) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span>Active Tags</span>
                          <Badge variant="secondary" className="font-mono">
                            {activeTags.length}
                          </Badge>
                        </CardTitle>
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
                        ) : activeTags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {activeTags.map((tag) => (
                              <Badge
                                key={tag.name}
                                variant="secondary"
                                className="group relative text-base py-2 pl-2.5 pr-3 transition-all duration-200 
                                  hover:bg-primary hover:text-primary-foreground cursor-pointer
                                  transform hover:scale-105"
                                onClick={() => handleTagClick(tag.name)}
                              >
                                <Hash className="inline-block h-4 w-4 mr-1 text-primary/60 group-hover:text-primary-foreground transition-colors"/>{clickedTag === tag.name ? (<span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div><HighlightText text={tag.name} highlight={searchQuery}/></span>) : (<HighlightText text={tag.name} highlight={searchQuery}/>)}<span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary-foreground/20 group-hover:text-primary-foreground">
                                  {tag.count}
                                </span>
                              </Badge>
                            ))}
                          </div>
                        ) : searchQuery ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No active tags found matching "{searchQuery}"
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  )}

                  {/* Inactive Tags Section */}
                  {(searchQuery || inactiveTags.length > 0) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Available Tags
                          </span>
                          <Badge
                            variant="secondary"
                            className="font-mono text-muted-foreground"
                          >
                            {inactiveTags.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {inactiveTags.length > 0 ? (
                          <>
                            {!searchQuery && (
                              <p className="text-sm text-muted-foreground mb-4">
                                Be the first to create projects for these tags!
                                🚀
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {inactiveTags.map((tag) => (
                                <Badge
                                  key={tag.name}
                                  variant="outline"
                                  className="group relative text-base py-2 pl-2.5 pr-3 
                                    opacity-60 cursor-not-allowed select-none"
                                >
                                  <Hash className="inline-block h-4 w-4 mr-1 text-muted-foreground"/><HighlightText text={tag.name} highlight={searchQuery}/>
                                </Badge>
                              ))}
                            </div>
                          </>
                        ) : searchQuery ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No available tags found matching "{searchQuery}"
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  )}

                  {/* No results message when searching */}
                  {searchQuery && filteredTags.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No tags found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </ProjectsProvider>
  );
}
