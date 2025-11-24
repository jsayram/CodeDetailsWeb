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
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_CATEGORIES } from "@/constants/project-categories";
import { getTagInfo } from "@/constants/tag-descriptions";
import { useTagCache } from "@/hooks/use-tag-cache";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { GenericLoadingState } from "@/components/LoadingState/GenericLoadingState";

function SearchContent() {
  const router = useRouter();
  const { projects, loading } = useProjects();
  const { tags: allTags, isLoading: tagsLoading } = useTagCache();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);


  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      if (searchQuery.trim()) {
        setHasSearched(true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch profiles only when user searches or switches to Users tab
  const fetchProfiles = useCallback(async () => {
    if (profilesLoading || allProfiles.length > 0) return; // Don't fetch if already loading or loaded
    
    try {
      setProfilesLoading(true);
      const response = await fetch("/api/profiles");
      if (!response.ok) throw new Error("Failed to fetch profiles");
      const data = await response.json();
      setAllProfiles(data);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setProfilesLoading(false);
    }
  }, [profilesLoading, allProfiles.length]);

  // Trigger profile fetch when user searches or switches to users tab
  useEffect(() => {
    if (debouncedSearchQuery.trim() || hasSearched) {
      fetchProfiles();
    }
  }, [debouncedSearchQuery, hasSearched, fetchProfiles]);

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
    const searchLower = debouncedSearchQuery.toLowerCase().trim();
    const allCategories = Object.entries(PROJECT_CATEGORIES);
    
    if (!searchLower) return allCategories.slice(0, 20);
    
    return allCategories
      .filter(([key, category]) => {
        return (
          category.label.toLowerCase().includes(searchLower) ||
          category.description.toLowerCase().includes(searchLower) ||
          key.toLowerCase().includes(searchLower) ||
          (category.keywords && category.keywords.toLowerCase().includes(searchLower))
        );
      })
      .slice(0, 20);
  }, [debouncedSearchQuery]);

  // Filter tags
  const filteredTags = useMemo(() => {
    const searchLower = debouncedSearchQuery.toLowerCase().trim();
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
    const filteredActive = sortedActiveTags.filter((tag) => {
      const tagLower = tag.name.toLowerCase();
      
      // Check tag name
      if (tagLower.includes(searchLower)) return true;
      
      // Check tag description and keywords from tag-descriptions.ts
      const tagInfo = getTagInfo(tag.name);
      if (tagInfo) {
        return (
          tagInfo.description.toLowerCase().includes(searchLower) ||
          tagInfo.keywords.toLowerCase().includes(searchLower)
        );
      }
      
      return false;
    });
    const filteredInactive = sortedInactiveTags.filter((tag) => {
      const tagLower = tag.name.toLowerCase();
      
      // Check tag name
      if (tagLower.includes(searchLower)) return true;
      
      // Check tag description and keywords
      const tagInfo = getTagInfo(tag.name);
      if (tagInfo) {
        return (
          tagInfo.description.toLowerCase().includes(searchLower) ||
          tagInfo.keywords.toLowerCase().includes(searchLower)
        );
      }
      
      return false;
    });
    
    const top30Active = filteredActive.slice(0, 30);
    const remainingSlots = 30 - top30Active.length;
    const additionalTags = remainingSlots > 0 ? filteredInactive.slice(0, remainingSlots) : [];
    return [...top30Active, ...additionalTags];
  }, [allTags, debouncedSearchQuery]);

  // Filter users (get ALL users from profiles API and enhance with project data)
  const { activeUsers, inactiveUsers, totalInactiveCount } = useMemo(() => {
    if (!allProfiles.length) {
      return { activeUsers: [], inactiveUsers: [], totalInactiveCount: 0 };
    }

    const searchLower = debouncedSearchQuery.toLowerCase().trim();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Build a map of username -> project tags for tag-based search
    const userTagsMap = new Map<string, Set<string>>();
    projects.forEach((project) => {
      if (!project.deleted_at && project.profile?.username && project.tags) {
        const username = project.profile.username;
        if (!userTagsMap.has(username)) {
          userTagsMap.set(username, new Set());
        }
        const tagSet = userTagsMap.get(username)!;
        project.tags.forEach((tag) => {
          tagSet.add(tag.toLowerCase());
        });
      }
    });

    // Build user data from profiles and enhance with project stats
    const projectStatsMap = new Map<string, {
      projectCount: number;
      totalFavorites: number;
      lastActivityDate: Date | null;
    }>();

    projects.forEach((project) => {
      if (!project.deleted_at && project.profile?.username) {
        const username = project.profile.username;
        const existing = projectStatsMap.get(username);
        const projectDate = new Date(project.updated_at || project.created_at || Date.now());
        const favorites = Number(project.total_favorites) || 0;
        
        if (existing) {
          existing.projectCount++;
          existing.totalFavorites += favorites;
          if (!existing.lastActivityDate || projectDate > existing.lastActivityDate) {
            existing.lastActivityDate = projectDate;
          }
        } else {
          projectStatsMap.set(username, {
            projectCount: 1,
            totalFavorites: favorites,
            lastActivityDate: projectDate,
          });
        }
      }
    });

    // Map all profiles to user objects
    const allUsers = allProfiles.map(profile => {
      const stats = projectStatsMap.get(profile.username) || {
        projectCount: 0,
        totalFavorites: 0,
        lastActivityDate: null,
      };
      
      const lastActivity = stats.lastActivityDate || (profile.last_activity_date ? new Date(profile.last_activity_date) : null);
      const isActive = lastActivity ? lastActivity >= sevenDaysAgo : false;
      // Heavy weight on projects and favorites, minimal weight on recent activity
      // Projects: 100 points each, Favorites: 50 points each, Active: 5 points
      const score = (stats.projectCount * 100) + (stats.totalFavorites * 50) + (isActive ? 5 : 0);

      return {
        username: profile.username,
        email: profile.email_address || null,
        profileImage: profile.profile_image_url || null,
        fullName: profile.full_name || null,
        projectCount: stats.projectCount,
        totalFavorites: stats.totalFavorites,
        lastActivityDate: lastActivity,
        isActive,
        score,
        createdAt: profile.created_at ? new Date(profile.created_at) : null,
      };
    });
    
    // Separate active and inactive users
    const active = allUsers.filter(user => user.projectCount > 0);
    const inactive = allUsers.filter(user => user.projectCount === 0);
    
    // Sort active by score descending
    const sortedActive = active.sort((a, b) => b.score - a.score);
    
    // Sort inactive by creation date (newest first)
    const sortedInactive = inactive.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    // Apply search filter with enhanced tag-based matching
    const matchesSearch = (user: typeof allUsers[0]) => {
      if (!searchLower) return true;
      
      // Check username, fullName, email
      const basicMatch = 
        user.username.toLowerCase().includes(searchLower) ||
        (user.fullName?.toLowerCase().includes(searchLower)) ||
        (user.email?.toLowerCase().includes(searchLower));
      
      if (basicMatch) return true;
      
      // Check if user has any project tags matching the search
      const userTags = userTagsMap.get(user.username);
      if (userTags) {
        for (const tag of userTags) {
          if (tag.includes(searchLower)) {
            return true;
          }
        }
      }
      
      return false;
    };

    const filteredActive = sortedActive.filter(matchesSearch);
    const filteredInactive = sortedInactive.filter(matchesSearch);
    
    return {
      activeUsers: filteredActive.slice(0, 30),
      inactiveUsers: filteredInactive, // Show ALL inactive users (no limit)
      totalInactiveCount: filteredInactive.length
    };
  }, [allProfiles, projects, debouncedSearchQuery]);

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
  const totalResults = filteredCategories.length + filteredTags.length + activeUsers.length + inactiveUsers.length;

  const isSearching = debouncedSearchQuery !== searchQuery;
  const isLoadingData = (debouncedSearchQuery.trim() && profilesLoading);
  const showEmptyState = !hasSearched && !debouncedSearchQuery.trim();

  return (
    <div className="flex justify-center w-full mb-20">
      <div className="w-full px-4 2xl:px-8 3xl:px-12">
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
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Empty State - No search yet */}
          {showEmptyState ? (
            <div className="text-center py-20">
              <Search className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl 3xl:text-2xl 4xl:text-3xl font-semibold mb-2">Start Searching</h3>
              <p className="text-muted-foreground max-w-md mx-auto 3xl:text-lg 4xl:text-xl">
                Type in the search box above to find projects, categories, tags, and users.
                Search by name, description, or even project tags!
              </p>
            </div>
          ) : isLoadingData ? (
            <div className="space-y-6">
              <GenericLoadingState type="card" itemsCount={6} />
            </div>
          ) : (
            <>
          {/* Results Summary */}
          {debouncedSearchQuery && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Found {totalResults} results</span>
              <Badge variant="secondary" className="font-mono">
                {filteredCategories.length} categories
              </Badge>
              <Badge variant="secondary" className="font-mono">
                {filteredTags.length} tags
              </Badge>
              <Badge variant="secondary" className="font-mono">
                {activeUsers.length + inactiveUsers.length} users
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
              {/* Users - First */}
              {(activeUsers.length > 0 || inactiveUsers.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Users
                      <Badge variant="secondary">{activeUsers.length + inactiveUsers.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeUsers.map((user) => {
                        const isLoading = loadingItem === `user-${user.username}`;
                        return (
                          <div
                            key={user.username}
                            className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent hover:shadow-md ${
                              isLoading ? "opacity-50" : ""
                            }`}
                            onClick={() => handleUserClick(user.username)}
                          >
                            <div className="flex items-start gap-4 relative">
                              {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
                                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                              {user.profileImage ? (
                                <img
                                  src={user.profileImage}
                                  alt={user.username}
                                  className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-offset-background"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-xl font-semibold ring-2 ring-offset-2 ring-offset-background">
                                  {user.username[0]?.toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-medium truncate">{user.username}</h3>
                                </div>
                                {user.fullName && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {user.fullName}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge variant="secondary" className="text-xs">
                                    {user.projectCount} {user.projectCount === 1 ? "project" : "projects"}
                                  </Badge>
                                  {user.totalFavorites > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      ⭐ {user.totalFavorites}
                                    </Badge>
                                  )}
                                  {user.isActive && (
                                    <Badge variant="default" className="text-xs bg-green-600">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {inactiveUsers.map((user) => (
                        <div
                          key={user.username}
                          className="p-4 rounded-lg border cursor-not-allowed opacity-40"
                        >
                          <div className="flex items-start gap-4">
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.username}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-xl font-semibold">
                                {user.username[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{user.username}</h3>
                              {user.fullName && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {user.fullName}
                                </p>
                              )}
                              <Badge variant="outline" className="text-xs mt-2">
                                No projects
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags - Second */}
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

              {/* Categories - Third */}
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

              {/* No Results */}
              {debouncedSearchQuery && totalResults === 0 && (
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
            <TabsContent value="users" className="mt-6 space-y-6">
              {activeUsers.length > 0 || inactiveUsers.length > 0 ? (
                <>
                  {/* Top 3 Contributors */}
                  {activeUsers.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                        Top Contributors
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeUsers.slice(0, 3).map((user, index) => {
                          const isLoading = loadingItem === `user-${user.username}`;
                          const getLeaderboardBadge = (position: number) => {
                            const medals = ['🥇', '🥈', '🥉'];
                            const titles = ['1st Place', '2nd Place', '3rd Place'];
                            return (
                              <div
                                className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center"
                                title={titles[position]}
                              >
                                <span className="text-xl" role="img">
                                  {medals[position]}
                                </span>
                              </div>
                            );
                          };
                          
                          const getLeaderboardCardStyle = (position: number) => {
                            const styles = [
                              'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-transparent dark:from-yellow-950/20',
                              'border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-transparent dark:from-gray-950/20',
                              'border-2 border-amber-600 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20'
                            ];
                            return styles[position] || '';
                          };

                          return (
                            <Card
                              key={user.username}
                              className={`p-4 cursor-pointer hover:bg-accent/50 transition-all transform hover:scale-105 ${
                                isLoading ? "opacity-50" : ""
                              } ${getLeaderboardCardStyle(index)}`}
                              onClick={() => handleUserClick(user.username)}
                            >
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  {isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full z-10">
                                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  )}
                                  {user.profileImage ? (
                                    <div className="relative">
                                      <img
                                        src={user.profileImage}
                                        alt={user.username}
                                        className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-offset-background"
                                      />
                                      {getLeaderboardBadge(index)}
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-xl font-semibold">
                                        {user.username[0]?.toUpperCase()}
                                      </div>
                                      {getLeaderboardBadge(index)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium truncate">{user.username}</h3>
                                  {user.fullName && (
                                    <p className="text-sm text-muted-foreground truncate">
                                      {user.fullName}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <Badge variant="secondary" className="text-xs">
                                      {user.projectCount} {user.projectCount === 1 ? "project" : "projects"}
                                    </Badge>
                                    {user.totalFavorites > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        ⭐ {user.totalFavorites}
                                      </Badge>
                                    )}
                                    {user.isActive && (
                                      <Badge variant="default" className="text-xs bg-green-600">
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Honorable Mentions */}
                  {activeUsers.length > 3 && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            ⭐️ Honorable Mentions ⭐️
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeUsers.slice(3).map((user) => {
                          const isLoading = loadingItem === `user-${user.username}`;
                          return (
                            <Card
                              key={user.username}
                              className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                                isLoading ? "opacity-50" : ""
                              }`}
                              onClick={() => handleUserClick(user.username)}
                            >
                              <div className="flex items-center gap-4 relative">
                                {isLoading && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                )}
                                {user.profileImage ? (
                                  <img
                                    src={user.profileImage}
                                    alt={user.username}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-xl font-semibold">
                                    {user.username[0]?.toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium truncate">{user.username}</h3>
                                  {user.fullName && (
                                    <p className="text-sm text-muted-foreground truncate">
                                      {user.fullName}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <Badge variant="secondary" className="text-xs">
                                      {user.projectCount} {user.projectCount === 1 ? "project" : "projects"}
                                    </Badge>
                                    {user.totalFavorites > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        ⭐ {user.totalFavorites}
                                      </Badge>
                                    )}
                                    {user.isActive && (
                                      <Badge variant="default" className="text-xs bg-green-600">
                                        Active
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Inactive Users */}
                  {inactiveUsers.length > 0 && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Inactive Users (showing {totalInactiveCount} total)
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {inactiveUsers.map((user) => (
                          <Card
                            key={user.username}
                            className="p-4 cursor-not-allowed opacity-40"
                          >
                            <div className="flex items-center gap-4">
                              {user.profileImage ? (
                                <img
                                  src={user.profileImage}
                                  alt={user.username}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-xl font-semibold">
                                  {user.username[0]?.toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{user.username}</h3>
                                {user.fullName && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {user.fullName}
                                  </p>
                                )}
                                <Badge variant="outline" className="text-xs mt-2">
                                  No projects
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No users found
                </div>
              )}
            </TabsContent>
          </Tabs>
            </>
          )}
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
