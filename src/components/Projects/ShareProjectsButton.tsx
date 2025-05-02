"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getUserById } from "@/db/actions"; // Adjust the import path as necessary
import Image from "next/image";

interface ShareProjectButtonProps {
  userId: string;
}

export const ShareProjectsButton = ({ userId }: ShareProjectButtonProps) => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const user = await getUserById(userId); // Use your existing action
        if (!user) throw new Error("User not found");
        setUsername(user.username);
      } catch (error) {
        console.error("Error fetching username:", error);
        toast.error("Could not load user information");
      }
    };

    if (userId) {
      fetchUsername();
    }
  }, [userId]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!username) {
      toast.error("Cannot share: username not found");
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
            className="text-muted-foreground ml-2 hover:cursor-pointer"
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
    >
      <ExternalLink className="h-4 w-4" />
      Copy Share Projects Link
    </Button>
  );
};

export default ShareProjectsButton;
