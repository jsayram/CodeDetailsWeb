"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { useSupabaseToken } from "@/hooks/use-SupabaseClerkJWTToken";
import { ProjectsProvider, useProjects } from "@/providers/projects-provider";
import { HeaderSection } from "@/components/layout/HeaderSection";
import { FooterSection } from "@/components/layout/FooterSection";
import { PageBanner } from "@/components/ui/page-banner";
import { Search, Hash, Folder, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";
import { useTagCache } from "@/hooks/use-tag-cache";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function SearchContent() {
  const router = useRouter();
  const { projects, loading } = useProjects();
  const { tags: allTags, isLoading: tagsLoading } = useTagCache();
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  // Filter categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((project) => {
      if (!project.deleted_at) {
        counts[project.category] = (counts[project.category] || 0) + 1;
      }
    });
    return counts;
  }, [projects]);

  const filteredCategories = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    const allCategories = Object.entries(PROJECT_CATEGORIES);
    
    if (!searchLower) return allCategories.slice(0, 20);
    
    return allCategories
      .filter(([key, category]) => {
        return (
          category.label.toLowerCase().includes(searchLower) ||
          category.description.toLowerCase().includes(searchLower) ||
          key.toLowerCase().includes(searchLower)
        );
      })
      .slice(0, 20);
  }, [searchQuery]);

  // Filter tags
  const filteredTags = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    const tags = allTags || [];
    
    // Separate tags with projects (active) and without (inactive)
    const activeTags = tags.filter((tag) => (tag.count || 0) > 0);
    const inactiveTags = tags.filter((tag) => !tag.count || tag.count === 0);
    
    // Sort active tags by count (most used first)
    const sortedActiveTags = activeTags.sort((a, b) => (b.count || 0) - (a.count || 0));
    
    // Sort inactive tags alphabetically
    const sortedInactiveTags = inactiveTags.sort((a, b) => a.name.localeCompare(b.name));
    
    if (!searchLower) {
      // Return top 30 active tags first, then fill remaining with inactive tags
      const top30Active = sortedActiveTags.slice(0, 30);
      const remainingSlots = 30 - top30Active.length;
      const additionalTags = remainingSlots > 0 ? sortedInactiveTags.slice(0, remainingSlots) : [];
      return [...top30Active, ...additionalTags];
    }
    
    // When searching, filter and then apply same logic
    const filteredActive = sortedActiveTags.filter((tag) =>
      tag.name.toLowerCase().includes(searchLower)
    );
    const filteredInactive = sortedInactiveTags.filter((tag) =>
      tag.name.toLowerCase().includes(searchLower)
    );
    
    const top30Active = filteredActive.slice(0, 30);
    const remainingSlots = 30 - top30Active.length;
    const additionalTags = remainingSlots > 0 ? filteredInactive.slice(0, remainingSlots) : [];
    return [...top30Active, ...additionalTags];
  }, [allTags, searchQuery]);

  // Filter users (get unique usernames from projects)
  const filteredUsers = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    const userMap = new Map<string, { username: string; projectCount: number }>();
    
    projects.forEach((project) => {
      if (!project.deleted_at && project.profile?.username) {
        const username = project.profile.username;
        const existing = userMap.get(username);
        if (existing) {
          existing.projectCount++;
        } else {
          userMap.set(username, {
            username: username,
            projectCount: 1,
          });
        }
      }
    });
    
    const users = Array.from(userMap.values());
    
    // Sort by project count
    const sortedUsers = users.sort((a, b) => b.projectCount - a.projectCount);
    
    if (!searchLower) return sortedUsers.slice(0, 20);
    
    return sortedUsers
      .filter((user) => user.username.toLowerCase().includes(searchLower))
      .slice(0, 20);
  }, [projects, searchQuery]);

  const handleCategoryClick = (key: string, count: number) => {
    if (count === 0) return;
    setLoadingItem(`category-${key}`);
    router.push(`/categories/${encodeURIComponent(key)}`);
  };

  const handleTagClick = (tagName: string) => {
    setLoadingItem(`tag-${tagName}`);
    router.push(`/tags/${encodeURIComponent(tagName)}`);
  };

  const handleUserClick = (username: string) => {
    setLoadingItem(`user-${username}`);
    router.push(`/users/${encodeURIComponent(username)}`);
  };

  const activeTags = filteredTags.filter((tag) => (tag.count ?? 0) > 0);
  const totalResults = filteredCategories.length + filteredTags.length + filteredUsers.length;

  return (
    <div className="flex justify-center w-full mb-20">
      <div className="w-full max-w-7xl px-4">
        <div className="flex flex-col gap-6 mb-6 py-3">
          <PageBanner
            icon={<Search className="h-8 w-8 text-primary" />}
            bannerTitle="Search"
            description="Search across categories, tags, and users"
            isUserBanner={false}
            gradientFrom="indigo-900"
            gradientVia="blue-800"
            gradientTo="purple-800"
            borderColor="border-indigo-700/40"
            textGradient="from-fuchsia-400 via-indigo-400 to-cyan-400"
          />

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search categories, tags, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
              autoFocus
            />
          </div>

          {/* Results Summary */}
          {searchQuery && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Found {totalResults} results</span>
              <Badge variant="secondary" className="font-mono">
                {filteredCategories.length} categories
              </Badge>
              <Badge variant="secondary" className="font-mono">
                {filteredTags.length} tags
              </Badge>
              <Badge variant="secondary" className="font-mono">
                {filteredUsers.length} users
              </Badge>
            </div>
          )}

          {/* Tabbed Results */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            {/* All Results Tab */}
            <TabsContent value="all" className="space-y-6 mt-6">
              {/* Categories */}
              {filteredCategories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Folder className="h-5 w-5" />
                      Categories
                      <Badge variant="secondary">{filteredCategories.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredCategories.map(([key, category]) => {
                        const count = categoryCounts[key] || 0;
                        const isLoading = loadingItem === `category-${key}`;
                        return (
                          <div
                            key={key}
                            className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent ${
                              count === 0 ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={() => handleCategoryClick(key, count)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold">{category.label}</h3>
                              <Badge variant={count > 0 ? "secondary" : "outline"}>
                                {count}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {category.description}
                            </p>
                            {isLoading && (
                              <div className="mt-2 flex items-center gap-2 text-sm">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Loading...
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {filteredTags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      Tags
                      <Badge variant="secondary">{filteredTags.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {filteredTags.map((tag) => {
                        const isActive = (tag.count ?? 0) > 0;
                        const isLoading = loadingItem === `tag-${tag.name}`;
                        return (
                          <Badge
                            key={tag.name}
                            variant={isActive ? "secondary" : "outline"}
                            className={`group text-base py-2 pl-2.5 pr-3 transition-all duration-200 ${
                              isActive
                                ? "hover:bg-primary hover:text-primary-foreground cursor-pointer transform hover:scale-105"
                                : "opacity-60 cursor-not-allowed"
                            }`}
                            onClick={() => isActive && handleTagClick(tag.name)}
                          >
                            <Hash className="inline-block h-4 w-4 mr-1" />
                            {isLoading ? (
                              <span className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                {tag.name}
                              </span>
                            ) : (
                              <>{tag.name}</>
                            )}
                            {isActive && (
                              <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary-foreground/20 group-hover:text-primary-foreground">
                                {tag.count}
                              </span>
                            )}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Users */}
              {filteredUsers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Users
                      <Badge variant="secondary">{filteredUsers.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredUsers.map((user) => {
                        const isLoading = loadingItem === `user-${user.username}`;
                        return (
                          <div
                            key={user.username}
                            className="p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent"
                            onClick={() => handleUserClick(user.username)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{user.username}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {user.projectCount} {user.projectCount === 1 ? "project" : "projects"}
                              </Badge>
                            </div>
                            {isLoading && (
                              <div className="mt-2 flex items-center gap-2 text-sm">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Loading...
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Results */}
              {searchQuery && totalResults === 0 && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    Try searching with different keywords
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Categories Only Tab */}
            <TabsContent value="categories" className="mt-6">
              {filteredCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map(([key, category]) => {
                    const count = categoryCounts[key] || 0;
                    const isLoading = loadingItem === `category-${key}`;
                    return (
                      <Card
                        key={key}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          count === 0 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={() => handleCategoryClick(key, count)}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {category.label}
                            <Badge variant={count > 0 ? "secondary" : "outline"}>
                              {count}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            {category.description}
                          </p>
                          {isLoading && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Loading...
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No categories found
                </div>
              )}
            </TabsContent>

            {/* Tags Only Tab */}
            <TabsContent value="tags" className="mt-6">
              {filteredTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filteredTags.map((tag) => {
                    const isActive = (tag.count ?? 0) > 0;
                    const isLoading = loadingItem === `tag-${tag.name}`;
                    return (
                      <Badge
                        key={tag.name}
                        variant={isActive ? "secondary" : "outline"}
                        className={`group text-base py-2 pl-2.5 pr-3 transition-all duration-200 ${
                          isActive
                            ? "hover:bg-primary hover:text-primary-foreground cursor-pointer transform hover:scale-105"
                            : "opacity-60 cursor-not-allowed"
                        }`}
                        onClick={() => isActive && handleTagClick(tag.name)}
                      >
                        <Hash className="inline-block h-4 w-4 mr-1" />
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            {tag.name}
                          </span>
                        ) : (
                          <>{tag.name}</>
                        )}
                        {isActive && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary-foreground/20 group-hover:text-primary-foreground">
                            {tag.count}
                          </span>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No tags found
                </div>
              )}
            </TabsContent>

            {/* Users Only Tab */}
            <TabsContent value="users" className="mt-6">
              {filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredUsers.map((user) => {
                    const isLoading = loadingItem === `user-${user.username}`;
                    return (
                      <Card
                        key={user.username}
                        className="cursor-pointer transition-all hover:shadow-lg"
                        onClick={() => handleUserClick(user.username)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">{user.username}</span>
                            </div>
                            <Badge variant="secondary">
                              {user.projectCount}
                            </Badge>
                          </div>
                          {isLoading && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Loading...
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No users found
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const { user } = useUser();
  const { token } = useSupabaseToken();

  return (
    <ProjectsProvider token={token} userId={user?.id ?? null}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderSection />
          <SearchContent />
          <FooterSection />
        </SidebarInset>
      </SidebarProvider>
    </ProjectsProvider>
  );
}
