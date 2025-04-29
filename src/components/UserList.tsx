"use client";

import { useEffect, useState, useCallback } from "react";
import { SelectProfile } from "@/db/schema/profiles";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { GenericLoadingState } from "@/components/LoadingState/GenericLoadingState";

type UserWithProjectCount = SelectProfile & {
  project_count: number;
};

export function UserList() {
  const [users, setUsers] = useState<UserWithProjectCount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Separate active and inactive users
  const activeUsers = users.filter((user) => user.project_count > 0);
  const inactiveUsers = users.filter((user) => user.project_count === 0);

  // First sort all active users to determine the true leaders (before filtering)
  const sortedActiveUsers = [...activeUsers].sort((a, b) => {
    // Sort by project count first
    if (b.project_count !== a.project_count) {
      return b.project_count - a.project_count;
    }
    // If project counts are equal, sort by updated_at date
    return (
      new Date(b.updated_at ?? 0).getTime() -
      new Date(a.updated_at ?? 0).getTime()
    );
  });

  // Get the actual top 3 users (these are our true leaders)
  const leaderboardUsers = sortedActiveUsers.slice(0, 3);
  const leaderIds = new Set(leaderboardUsers.map((user) => user.id));

  // Then filter users based on search
  const filteredActiveUsers = activeUsers.filter((user) => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;

    return (
      (user.username || "").toLowerCase().includes(searchLower) ||
      (user.full_name || "").toLowerCase().includes(searchLower) ||
      (user.email_address || "").toLowerCase().includes(searchLower)
    );
  });

  // Helper function to get the leader position (if any) for a user
  const getLeaderPosition = (userId: string): number => {
    const position = leaderboardUsers.findIndex(
      (leader) => leader.id === userId
    );
    return position;
  };

  const getLeaderboardBadge = (position: number) => {
    switch (position) {
      case 0:
        return (
          <div
            className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center"
            title="1st Place"
          >
            <span className="text-xl" role="img" aria-label="gold medal">
              🥇
            </span>
          </div>
        );
      case 1:
        return (
          <div
            className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center"
            title="2nd Place"
          >
            <span className="text-xl" role="img" aria-label="silver medal">
              🥈
            </span>
          </div>
        );
      case 2:
        return (
          <div
            className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center"
            title="3rd Place"
          >
            <span className="text-xl" role="img" aria-label="bronze medal">
              🥉
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  const getLeaderboardCardStyle = (position: number) => {
    switch (position) {
      case 0:
        return "border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-transparent dark:from-yellow-950/20";
      case 1:
        return "border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-transparent dark:from-gray-950/20";
      case 2:
        return "border-2 border-amber-600 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20";
      default:
        return "";
    }
  };

  if (isLoading) {
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
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Input
          type="search"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Leaderboard Section - Show only when not searching or when leaders are in filtered results */}
      {(!searchQuery ||
        filteredActiveUsers.some((user) => leaderIds.has(user.id))) && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            Top Contributors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaderboardUsers
              .filter(
                (user) =>
                  !searchQuery ||
                  (user.username || "")
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  (user.full_name || "")
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  (user.email_address || "")
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
              )
              .map((user, index) => (
                <Card
                  key={user.id}
                  className={`p-4 cursor-pointer hover:bg-accent/50 transition-all transform hover:scale-105 ${getLeaderboardCardStyle(
                    index
                  )}`}
                  onClick={() => router.push(`/users/${user.username}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {user.profile_image_url ? (
                        <div className="relative">
                          <img
                            src={user.profile_image_url}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-offset-background"
                          />
                          {getLeaderboardBadge(index)}
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-xl font-semibold">
                            {user.username?.[0]?.toUpperCase()}
                          </div>
                          {getLeaderboardBadge(index)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.username}</h3>
                        <span className="text-sm text-muted-foreground">
                          {user.project_count}{" "}
                          {user.project_count === 1 ? "project" : "projects"}
                        </span>
                      </div>
                      {user.full_name && (
                        <p className="text-sm text-muted-foreground">
                          {user.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Rest of the users - show all filtered users that aren't in the leaderboard */}
      {filteredActiveUsers.filter((user) => !leaderIds.has(user.id)).length >
        0 && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ⭐️ Honerable Mentions ⭐️
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActiveUsers
              .filter((user) => !leaderIds.has(user.id))
              .map((user) => (
                <Card
                  key={user.id}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => router.push(`/users/${user.username}`)}
                >
                  <div className="flex items-center gap-4">
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
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.username}</h3>
                        <span className="text-sm text-muted-foreground">
                          {user.project_count}{" "}
                          {user.project_count === 1 ? "project" : "projects"}
                        </span>
                      </div>
                      {user.full_name && (
                        <p className="text-sm text-muted-foreground">
                          {user.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

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
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{user.username}</h3>
                        <span className="text-sm text-muted-foreground">
                          No projects
                        </span>
                      </div>
                      {user.full_name && (
                        <p className="text-sm text-muted-foreground">
                          {user.full_name}
                        </p>
                      )}
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
