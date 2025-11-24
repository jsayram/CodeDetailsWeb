"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getCachedUserById } from "@/db/actions";
import Image from "next/image";

interface ShareProjectButtonProps {
  userId: string;
}

// Client-side cache to prevent redundant fetches during same session
const userCache = new Map<string, string | null>();

export const ShareProjectsButton = ({ userId }: ShareProjectButtonProps) => {
  const [username, setUsername] = useState<string | null>(() => {
    // Check client cache on mount
    return userCache.get(userId) ?? null;
  });
  const [loading, setLoading] = useState(!userCache.has(userId));

  // Memoize fetch function to prevent recreation on every render
  const fetchUsername = useCallback(async () => {
    // Skip if already cached
    if (userCache.has(userId)) {
      return;
    }

    try {
      setLoading(true);
      const user = await getCachedUserById(userId);
      if (!user) {
        console.warn("User not found in database, may need sync from Clerk");
        userCache.set(userId, null);
        setUsername(null);
        return;
      }
      userCache.set(userId, user.username);
      setUsername(user.username);
    } catch (error) {
      console.error("Error fetching username:", error);
      userCache.set(userId, null);
      setUsername(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && !userCache.has(userId)) {
      fetchUsername();
    }
  }, [userId, fetchUsername]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!username) {
      toast.error("Cannot share: User profile not synced yet", {
        description: "Please try again in a moment",
      });
      return;
    }
    const shareUrl = `${
      window.location.origin
    }/shared-projects/${encodeURIComponent(username)}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.dismiss();
      toast.success(
        <div className="relative flex flex-row items-center gap-2 ">
          <Image
            src="/images/mascot.png"
            alt="Code Minion"
            width={50}
            height={50}
            className="relative rounded-md"
          />
          <span className="right-2 top-2 text-ssm text-foreground">
            Copied to clipboard <br />{" "}
            <span className="text-muted-foreground">{shareUrl}</span>
          </span>{" "}
          <ExternalLink
            size={30}
            className="text-muted-foreground ml-2 hover:cursor-pointer cursor-pointer"
            onClick={() => {
              window.open(
                `/shared-projects/${encodeURIComponent(username)}`,
                "_blank"
              );
            }}
          />
        </div>
      );
    } catch (error) {
      toast.error("Failed to copy share link", {
        description: "Please try again",
      });
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="default"
      size="sm"
      className="inline-flex items-center gap-2 hover:cursor-pointer"
      disabled={loading || !username}
    >
      <ExternalLink className="h-4 w-4" />
      {loading ? "Loading..." : username ? "Copy Share Projects Link" : "Not Available"}
    </Button>
  );
};

export default ShareProjectsButton;
