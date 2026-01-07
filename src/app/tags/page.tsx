"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { ProjectsProvider } from "@/providers/projects-provider";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { PageBanner } from "@/components/ui/page-banner";
import { Hash, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTags } from "@/hooks/use-tags";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { HighlightText } from "@/components/HighlightText";

export default function TagsIndexPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { token, loading: tokenLoading } = useSupabaseToken();
  const router = useRouter();
  const { tags: allTags, isLoading: tagsLoading } = useTags();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [clickedTag, setClickedTag] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and sort tags
  const filteredTags = (allTags || [])
    .filter((tag) => {
      const searchLower = debouncedSearchQuery.toLowerCase().trim();
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

  return (
    <ProjectsProvider token={token} userId={user?.id ?? null}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderSection />
          <div className="flex justify-center w-full mb-20">
            <div className="w-full max-w-7xl mx-auto px-4 2xl:px-8 3xl:px-12">
              <div className="flex flex-col gap-6 mb-6 py-3">
                <PageBanner
                  icon={<Hash className="h-8 w-8 text-primary" />}
                  bannerTitle="Browse All Tags"
                  description="Discover projects by technology stack and features"
                  isUserBanner={false}
                  gradientFrom="purple-900"
                  gradientVia="indigo-800"
                  gradientTo="blue-800"
                  borderColor="border-purple-700/40"
                  textGradient="from-fuchsia-400 via-purple-400 to-indigo-400"
                />

                {/* Main Card with Title and Search */}
                <Card>
                  <CardHeader className="text-center space-y-4 pb-4">
                    <CardTitle className="text-3xl font-bold">
                      All Project Tags
                    </CardTitle>
                    <p className="text-muted-foreground text-base">
                      Browse and search through all available tags
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Search Input */}
                    <div className="relative w-full max-w-2xl mx-auto">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200" />
                      <Input
                        type="search"
                        placeholder="Search tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 text-base rounded-xl border-2 border-primary/20 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-md transition-all duration-200"
                      />
                    </div>

                <div className="space-y-6">

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
                                <Hash className="inline-block h-4 w-4 mr-1 text-primary/60 group-hover:text-primary-foreground transition-colors"/>{clickedTag === tag.name ? (<span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div><HighlightText text={tag.name} highlight={debouncedSearchQuery}/></span>) : (<HighlightText text={tag.name} highlight={debouncedSearchQuery}/>)}<span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary-foreground/20 group-hover:text-primary-foreground">
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
                                  <Hash className="inline-block h-4 w-4 mr-1 text-muted-foreground"/><HighlightText text={tag.name} highlight={debouncedSearchQuery}/>
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
