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
import { SearchContentSkeleton } from "./loading";

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
      } else {
        // Reset to initial state when search is cleared
        setHasSearched(false);
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
          key.toLowerCase().includes(searchLower)
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
      // Only match on tag name
      return tagLower.includes(searchLower);
    });
    const filteredInactive = sortedInactiveTags.filter((tag) => {
      const tagLower = tag.name.toLowerCase();
      // Only match on tag name
      return tagLower.includes(searchLower);
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
    
    // Apply search filter - only match on user info
    const matchesSearch = (user: typeof allUsers[0]) => {
      if (!searchLower) return true;
      
      // Check username, fullName, email only
      return (
        user.username.toLowerCase().includes(searchLower) ||
        (user.fullName?.toLowerCase().includes(searchLower)) ||
        (user.email?.toLowerCase().includes(searchLower))
      );
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
      <div className="w-full max-w-7xl mx-auto px-4 2xl:px-8 3xl:px-12">
        <div className="flex flex-col gap-6 mb-6 py-3">
          {/* Centered Hero Section with Mascot */}
          <div className="flex flex-col items-center justify-center gap-6 py-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 text-transparent bg-clip-text mb-4">
                Search Code Details
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover projects, explore categories, find tags, and connect with developers
              </p>
            </div>

            {/* Mascot with Speech Bubble */}
            <div className="relative flex items-start justify-center gap-4 mb-4">
              <div className="relative">
                <img 
                  src="/images/mascot.png" 
                  alt="Code Details Mascot" 
                  className="w-40 h-40 object-contain animate-bounce-slow"
                />
              </div>
              <div className="relative max-w-md bg-card border-2 border-primary/30 rounded-2xl p-4 shadow-lg">
                <div className="absolute -left-3 top-6 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-card border-b-8 border-b-transparent"></div>
                <div className="absolute -left-4 top-6 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-primary/30 border-b-8 border-b-transparent"></div>
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold text-primary">Hey there! 👋</span> 
                  <br />
                  I can help you find what you're looking for! Try searching for:
                  <br />
                  <span className="inline-flex items-center gap-1 mt-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-medium">Categories</span>
                    <span className="px-2 py-0.5 bg-accent/10 text-accent-foreground rounded-md text-xs font-medium">Tags</span>
                    <span className="px-2 py-0.5 bg-secondary/30 text-secondary-foreground rounded-md text-xs font-medium">Users</span>
                  </span>
                  <br />
                  <span className="text-muted-foreground text-xs mt-1 block">
                    Just type a keyword and I'll show you all related content!
                  </span>
                </p>
              </div>
            </div>

            {/* Centered Search Input */}
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200 peer-hover:text-primary peer-focus:text-primary" />
              <Input
                type="search"
                placeholder="Search categories, tags, or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="peer pl-12 pr-12 h-14 text-lg rounded-xl border-2 border-primary/20 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-md transition-all duration-200"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {/* Empty State - No search yet */}
          {showEmptyState ? (
            <div className="text-center py-12">
              <div className="max-w-2xl mx-auto space-y-4">
                <h3 className="text-2xl font-semibold">Ready to explore?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div 
                    className={`p-6 border-2 border-primary/20 rounded-xl hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer relative ${
                      loadingItem === 'explore-categories' ? 'opacity-50' : ''
                    }`}
                    onClick={() => {
                      setLoadingItem('explore-categories');
                      router.push('/categories');
                    }}
                  >
                    {loadingItem === 'explore-categories' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl z-10">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <Folder className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold mb-2">Categories</h4>
                    <p className="text-sm text-muted-foreground">Browse projects by category like Web Development, AI/ML, and more</p>
                  </div>
                  <div 
                    className={`p-6 border-2 border-accent/20 rounded-xl hover:border-accent/40 transition-all hover:shadow-lg cursor-pointer relative ${
                      loadingItem === 'explore-tags' ? 'opacity-50' : ''
                    }`}
                    onClick={() => {
                      setLoadingItem('explore-tags');
                      router.push('/tags');
                    }}
                  >
                    {loadingItem === 'explore-tags' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl z-10">
                        <div className="w-6 h-6 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <Hash className="h-8 w-8 text-accent-foreground mx-auto mb-3" />
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <p className="text-sm text-muted-foreground">Find projects tagged with technologies like React, Python, Docker</p>
                  </div>
                  <div 
                    className={`p-6 border-2 border-secondary/30 rounded-xl hover:border-secondary/50 transition-all hover:shadow-lg cursor-pointer relative ${
                      loadingItem === 'explore-users' ? 'opacity-50' : ''
                    }`}
                    onClick={() => {
                      setLoadingItem('explore-users');
                      router.push('/users');
                    }}
                  >
                    {loadingItem === 'explore-users' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl z-10">
                        <div className="w-6 h-6 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <Users className="h-8 w-8 text-secondary-foreground mx-auto mb-3" />
                    <h4 className="font-semibold mb-2">Users</h4>
                    <p className="text-sm text-muted-foreground">Discover talented developers and explore their projects</p>
                  </div>
                </div>
              </div>
            </div>
          ) : isLoadingData ? (
            <SearchContentSkeleton />
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
            <div className="flex justify-center w-full">
              <TabsList className="grid w-full grid-cols-4 max-w-md">
                <TabsTrigger value="all" className="cursor-pointer">All</TabsTrigger>
                <TabsTrigger value="categories" className="cursor-pointer">Categories</TabsTrigger>
                <TabsTrigger value="tags" className="cursor-pointer">Tags</TabsTrigger>
                <TabsTrigger value="users" className="cursor-pointer">Users</TabsTrigger>
              </TabsList>
            </div>

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
