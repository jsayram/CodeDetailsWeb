"use client";

import { useEffect, useState, useCallback } from "react";
import { SelectProfile } from "@/db/schema/profiles";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { GenericLoadingState } from "@/components/LoadingState/GenericLoadingState";
import { fetchTopContributorsPublic } from "@/app/actions/advanced-analytics";
import type { TopContributor } from "@/app/actions/advanced-analytics";
import { Trophy, Star, FileCode, Tag, Heart, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HighlightText } from "@/components/HighlightText";

type UserWithProjectCount = SelectProfile & {
  project_count: number;
  total_favorites: number;
  last_activity_date: Date | null;
};

export function UserList() {
  const [users, setUsers] = useState<UserWithProjectCount[]>([]);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [contributorsLoading, setContributorsLoading] = useState(true);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/profiles");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load top contributors from analytics
  useEffect(() => {
    async function loadContributors() {
      try {
        const contributors = await fetchTopContributorsPublic(20);
        setTopContributors(contributors);
      } catch (error) {
        console.error("Failed to load top contributors:", error);
      } finally {
        setContributorsLoading(false);
      }
    }

    loadContributors();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Separate active and inactive users
  const activeUsers = users.filter((user) => user.project_count > 0);
  const inactiveUsers = users.filter((user) => user.project_count === 0);

  // Filter top contributors based on search (username, email, tier)
  const filteredTopContributors = topContributors.filter((contributor) => {
    const searchLower = debouncedSearchQuery.toLowerCase().trim();
    if (!searchLower) return true;

    // Get the user's email from the users array if available
    const userProfile = users.find(u => u.user_id === contributor.user_id);
    const email = userProfile?.email_address || "";

    return (
      (contributor.username || "").toLowerCase().includes(searchLower) ||
      (contributor.full_name || "").toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower) ||
      (contributor.tier || "").toLowerCase().includes(searchLower)
    );
  });

  // Get top 3 for leaderboard display
  const leaderboardTop3 = filteredTopContributors.slice(0, 3);
  const topContributorUserIds = new Set(topContributors.map((c) => c.user_id));

  // Then filter users based on search (username, full name, email, tier)
  const filteredActiveUsers = activeUsers.filter((user) => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;

    return (
      (user.username || "").toLowerCase().includes(searchLower) ||
      (user.full_name || "").toLowerCase().includes(searchLower) ||
      (user.email_address || "").toLowerCase().includes(searchLower) ||
      (user.tier || "").toLowerCase().includes(searchLower)
    );
  });

  const getLeaderboardBadge = (position: number) => {
    switch (position) {
      case 0:
        return (
          <div
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center"
            title="1st Place"
          >
            <Trophy className="h-6 w-6 text-yellow-500 drop-shadow-lg" />
          </div>
        );
      case 1:
        return (
          <div
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center"
            title="2nd Place"
          >
            <Trophy className="h-6 w-6 text-gray-400 drop-shadow-lg" />
          </div>
        );
      case 2:
        return (
          <div
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center"
            title="3rd Place"
          >
            <Trophy className="h-6 w-6 text-orange-600 drop-shadow-lg" />
          </div>
        );
      default:
        return null;
    }
  };

  const getLeaderboardCardStyle = (position: number) => {
    switch (position) {
      case 0:
        return "border-2 border-yellow-400 dark:bg-gradient-to-br dark:from-yellow-950/20 dark:to-transparent ring-2 ring-yellow-400/20";
      case 1:
        return "border-2 border-gray-300 dark:bg-gradient-to-br dark:from-gray-950/20 dark:to-transparent ring-2 ring-gray-400/20";
      case 2:
        return "border-2 border-orange-600 dark:bg-gradient-to-br dark:from-orange-950/20 dark:to-transparent ring-2 ring-orange-600/20";
      default:
        return "";
    }
  };

  const getTierBadgeVariant = (tier: string | null) => {
    switch (tier?.toLowerCase()) {
      case 'diamond':
        return 'default';
      case 'pro':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleUserClick = (username: string, userId: string) => {
    setLoadingUserId(userId);
    router.push(`/users/${username}`);
  };

  if (isLoading || contributorsLoading) {
    return (
      <div aria-live="polite" aria-busy="true">
        <GenericLoadingState
          type="card"
          itemsCount={6}
          className="animate-in fade-in-50"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4" role="alert" aria-live="polite">
        <div className="p-4 text-destructive bg-destructive/10 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200" />
        <Input
          type="search"
          placeholder="Search by username, email, or tier (free/pro/diamond)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-base rounded-xl border-2 border-primary/20 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-md transition-all duration-200"
        />
      </div>

      {/* Top Contributors Leaderboard - Enhanced with contribution scores */}
      {leaderboardTop3.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Top Contributors
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Ranked by contribution score: Projects × 10 + Favorites Received × 5
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {leaderboardTop3.map((contributor, index) => (
              <Card
                key={contributor.user_id}
                className={`w-full md:w-[calc(50%-0.5rem)] xl:flex-1 xl:max-w-[calc(33.333%-0.667rem)] max-w-md p-10 cursor-pointer hover:bg-accent/50 transition-all transform hover:scale-105 ${
                  loadingUserId === contributor.user_id ? "opacity-50" : ""
                } ${getLeaderboardCardStyle(index)}`}
                onClick={() => handleUserClick(contributor.username, contributor.user_id)}
              >
                {getLeaderboardBadge(index)}
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {loadingUserId === contributor.user_id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full z-10">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {contributor.profile_image_url ? (
                        <div className="relative">
                          <img
                            src={contributor.profile_image_url}
                            alt={contributor.username}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-offset-2 ring-offset-background ring-primary/30"
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-xl font-semibold ring-2 ring-offset-2 ring-offset-background ring-primary/30">
                            {contributor.username?.[0]?.toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg truncate">
                          <HighlightText text={contributor.full_name || contributor.username} highlight={debouncedSearchQuery} />
                        </h3>
                        {/* Only show tier when searching and it's Pro/Diamond and matches */}
                        {debouncedSearchQuery && contributor.tier && contributor.tier !== 'free' && contributor.tier.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) && (
                          <Badge variant={getTierBadgeVariant(contributor.tier)} className="text-xs">
                            <HighlightText text={contributor.tier} highlight={debouncedSearchQuery} />
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        @<HighlightText text={contributor.username} highlight={debouncedSearchQuery} />
                      </p>
                      {/* Show email if searching and it matches */}
                      {debouncedSearchQuery && (() => {
                        const userProfile = users.find(u => u.user_id === contributor.user_id);
                        const email = userProfile?.email_address || "";
                        if (email && email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
                          return (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              <HighlightText text={email} highlight={debouncedSearchQuery} />
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Contribution Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <FileCode className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-2xl font-bold">{contributor.projects_count}</p>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Heart className="h-3.5 w-3.5 text-pink-500" />
                      </div>
                      <p className="text-2xl font-bold">{contributor.favorites_received}</p>
                      <p className="text-xs text-muted-foreground">Favorites</p>
                    </div>
                  </div>

                  {/* Contribution Score */}
                  <div className="text-center pt-2 border-t bg-primary/5 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground mb-1">Contribution Score</p>
                    <p className="text-2xl font-bold text-primary">
                      {contributor.contribution_score.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Honorable Mentions - Rest of top contributors (4-20) with score > 0 */}
      {filteredTopContributors.slice(3).filter(c => c.contribution_score > 0).length > 0 && (
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

          <div className="max-h-[600px] overflow-y-auto pr-2">
            <div className="flex flex-wrap gap-4 justify-center">
              {filteredTopContributors.slice(3).filter(c => c.contribution_score > 0).map((contributor, index) => (
                <Card
                  key={contributor.user_id}
                  className={`w-full md:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.667rem)] max-w-md md:max-w-none mx-auto md:mx-0 p-4 cursor-pointer hover:bg-accent transition-colors ${
                    loadingUserId === contributor.user_id ? "opacity-50" : ""
                  }`}
                  onClick={() => handleUserClick(contributor.username, contributor.user_id)}
                >
                <div className="flex items-center gap-4">
                  {loadingUserId === contributor.user_id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground min-w-[28px]">
                      #{index + 4}
                    </span>
                    {contributor.profile_image_url ? (
                      <img
                        src={contributor.profile_image_url}
                        alt={contributor.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-xl font-semibold">
                        {contributor.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">
                        <HighlightText text={contributor.full_name || contributor.username} highlight={debouncedSearchQuery} />
                      </h3>
                      {/* Only show tier when searching and it's Pro/Diamond and matches */}
                      {searchQuery && contributor.tier && contributor.tier !== 'free' && contributor.tier.toLowerCase().includes(searchQuery.toLowerCase()) && (
                        <Badge variant={getTierBadgeVariant(contributor.tier)} className="text-xs">
                          <HighlightText text={contributor.tier} highlight={debouncedSearchQuery} />
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @<HighlightText text={contributor.username} highlight={debouncedSearchQuery} />
                    </p>
                    {/* Show email if searching and it matches */}
                    {searchQuery && (() => {
                      const userProfile = users.find(u => u.user_id === contributor.user_id);
                      const email = userProfile?.email_address || "";
                      if (email && email.toLowerCase().includes(searchQuery.toLowerCase())) {
                        return (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            <HighlightText text={email} highlight={debouncedSearchQuery} />
                          </p>
                        );
                      }
                      return null;
                    })()}
                    <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-md">
                        <FileCode className="h-3 w-3 text-primary" />
                        {contributor.projects_count}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-pink-100 dark:bg-pink-950 rounded-md">
                        <Heart className="h-3 w-3 text-pink-500" />
                        {contributor.favorites_received}
                      </span>
                      <span className="font-bold text-primary ml-auto text-sm">
                        Score: {contributor.contribution_score}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            </div>
          </div>
        </>
      )}

      {/* Just Happy to Be Here - Contributors with score of 0 */}
      {filteredTopContributors.filter(c => c.contribution_score === 0).length > 0 && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                🙂 Just happy to be here 🙂
              </span>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto pr-2">
            <div className="flex flex-wrap gap-4 justify-center">
              {filteredTopContributors.filter(c => c.contribution_score === 0).map((contributor) => (
                <Card
                  key={contributor.user_id}
                  className={`w-full md:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.667rem)] max-w-md md:max-w-none mx-auto md:mx-0 p-4 cursor-pointer hover:bg-accent transition-colors ${
                    loadingUserId === contributor.user_id ? "opacity-50" : ""
                  }`}
                  onClick={() => handleUserClick(contributor.username, contributor.user_id)}
                >
                <div className="flex items-center gap-4">
                  {loadingUserId === contributor.user_id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {contributor.profile_image_url ? (
                      <img
                        src={contributor.profile_image_url}
                        alt={contributor.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-xl font-semibold">
                        {contributor.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">
                        <HighlightText text={contributor.full_name || contributor.username} highlight={debouncedSearchQuery} />
                      </h3>
                      {/* Only show tier when searching and it's Pro/Diamond and matches */}
                      {searchQuery && contributor.tier && contributor.tier !== 'free' && contributor.tier.toLowerCase().includes(searchQuery.toLowerCase()) && (
                        <Badge variant={getTierBadgeVariant(contributor.tier)} className="text-xs">
                          <HighlightText text={contributor.tier} highlight={debouncedSearchQuery} />
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @<HighlightText text={contributor.username} highlight={debouncedSearchQuery} />
                    </p>
                    {/* Show email if searching and it matches */}
                    {searchQuery && (() => {
                      const userProfile = users.find(u => u.user_id === contributor.user_id);
                      const email = userProfile?.email_address || "";
                      if (email && email.toLowerCase().includes(searchQuery.toLowerCase())) {
                        return (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            <HighlightText text={email} highlight={debouncedSearchQuery} />
                          </p>
                        );
                      }
                      return null;
                    })()}
                    <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-md">
                        <FileCode className="h-3 w-3 text-primary" />
                        {contributor.projects_count}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-pink-100 dark:bg-pink-950 rounded-md">
                        <Heart className="h-3 w-3 text-pink-500" />
                        {contributor.favorites_received}
                      </span>
                      <span className="font-bold text-muted-foreground ml-auto text-sm">
                        Score: {contributor.contribution_score}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            </div>
          </div>
        </>
      )}

      {/* All Other Users - only show if not matching top contributors */}
      {filteredActiveUsers.filter((user) => 
        !topContributorUserIds.has(user.user_id)
      ).length > 0 && (
        <>
          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                All Contributing Users
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {filteredActiveUsers
              .filter((user) => !topContributorUserIds.has(user.user_id))
              .map((user) => {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const isActive =
                  user.last_activity_date &&
                  new Date(user.last_activity_date) >= sevenDaysAgo;

                return (
                  <Card
                    key={user.id}
                    className={`w-full md:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.667rem)] max-w-md md:max-w-none mx-auto md:mx-0 p-4 cursor-pointer hover:bg-accent transition-colors ${
                      loadingUserId === user.id ? "opacity-50" : ""
                    }`}
                    onClick={() => handleUserClick(user.username, user.id)}
                  >
                    <div className="flex items-center gap-4">
                      {loadingUserId === user.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {user.profile_image_url ? (
                        <img
                          src={user.profile_image_url}
                          alt={user.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-xl font-semibold">
                          {user.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{user.username}</h3>
                        {user.full_name && (
                          <p className="text-sm text-muted-foreground truncate">
                            {user.full_name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          <span className="text-sm flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-md whitespace-nowrap">
                            <FileCode className="h-3 w-3 text-primary" />
                            {user.project_count}
                          </span>
                          {user.total_favorites > 0 && (
                            <span className="text-sm flex items-center gap-1 px-2 py-0.5 bg-pink-100 dark:bg-pink-950 rounded-md whitespace-nowrap">
                              <Heart className="h-3 w-3 text-pink-500" />
                              {user.total_favorites}
                            </span>
                          )}
                          {isActive && (
                            <span className="text-sm text-green-600 dark:text-green-400 px-2 py-0.5 bg-green-100 dark:bg-green-950 rounded-md whitespace-nowrap">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}

            {/* Inactive Users - only shown when not searching */}
            {!searchQuery &&
              inactiveUsers.map((user) => (
                <Card
                  key={user.id}
                  className="p-4 cursor-not-allowed opacity-40 relative"
                >
                  <div className="flex items-center gap-4">
                    {user.profile_image_url && (
                      <img
                        src={user.profile_image_url}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{user.username}</h3>
                      {user.full_name && (
                        <p className="text-sm text-muted-foreground truncate">
                          {user.full_name}
                        </p>
                      )}
                      <span className="text-sm text-muted-foreground px-2 py-0.5 bg-accent rounded-md whitespace-nowrap inline-block mt-2">
                        No projects
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
