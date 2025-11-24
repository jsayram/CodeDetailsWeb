'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star, FileCode, Tag } from "lucide-react";
import type { TopContributor } from "@/app/actions/advanced-analytics";

interface TopContributorsCardProps {
  contributors: TopContributor[];
}

export function TopContributorsCard({ contributors }: TopContributorsCardProps) {
  const getMedalColor = (index: number) => {
    if (index === 0) return "text-yellow-500";
    if (index === 1) return "text-gray-400";
    if (index === 2) return "text-orange-600";
    return "text-muted-foreground";
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

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <CardTitle>Top Contributors</CardTitle>
        </div>
        <CardDescription>
          Users ranked by contribution score (Projects × 10 + Favorites × 2 + Approved Tags × 5)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto overscroll-behavior-y-contain scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
        <div className="space-y-4">
          {contributors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No contributors yet
            </p>
          ) : (
            contributors.map((contributor, index) => (
              <div
                key={contributor.user_id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8">
                  {index < 3 ? (
                    <Trophy className={`h-5 w-5 ${getMedalColor(index)}`} />
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      #{index + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contributor.profile_image_url || undefined} />
                  <AvatarFallback>
                    {contributor.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">
                      {contributor.full_name || contributor.username}
                    </p>
                    {contributor.tier && contributor.tier !== 'free' && (
                      <Badge variant={getTierBadgeVariant(contributor.tier)} className="text-xs">
                        {contributor.tier}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    @{contributor.username}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1" title="Projects">
                    <FileCode className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">{contributor.projects_count}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Favorites Received">
                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="font-medium">{contributor.favorites_received}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Approved Tags">
                    <Tag className="h-3.5 w-3.5 text-green-500" />
                    <span className="font-medium">{contributor.approved_tags_count}</span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right min-w-[80px]">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-lg font-bold text-primary">
                    {contributor.contribution_score.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
