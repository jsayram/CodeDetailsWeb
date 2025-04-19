import { useEffect, useRef } from "react";
import { fetchCachedUserTier, revalidateUserCache } from "@/lib/ProjectsCacheUtils";

/**
 * Custom hook to track user tier changes
 */
export function useTierTracker(
  isAuthenticated: boolean,
  isLoading: boolean,
  userId: string | null,
  setHasFetchedProjects: React.Dispatch<React.SetStateAction<boolean>>
) {
  // Track tier changes
  const previousTierRef = useRef<string>("");
  const isFetching = useRef(false);

  // Track tier changes and trigger refetch when needed
  useEffect(() => {
    // Early return if any required condition is not met
    if (!isAuthenticated || isLoading || !userId) {
      return;
    }

    async function checkTierChanges() {
      // Prevent concurrent fetches
      if (isFetching.current) {
        return;
      }
      
      try {
        isFetching.current = true;
        // We can safely use userId here since we checked it's not null above
        const currentTier = await fetchCachedUserTier(userId as string);
        console.log("🎫 Tier check: current=", currentTier);

        // Check for tier changes
        if (
          previousTierRef.current &&
          previousTierRef.current !== currentTier
        ) {
          console.log(
            "🔄 Tier changed from",
            previousTierRef.current,
            "to",
            currentTier
          );
          await revalidateUserCache(userId as string);
          setHasFetchedProjects(false);
        } else if (previousTierRef.current === currentTier) {
          console.log("✅ Tier unchanged:", currentTier);
        } else {
          console.log("🔄 Initial tier loaded:", currentTier);
        }

        // Update tier ref
        previousTierRef.current = currentTier;
      } catch (error) {
        console.error("Failed to check tier changes:", error);
      } finally {
        isFetching.current = false;
      }
    }

    checkTierChanges();
  }, [isAuthenticated, isLoading, userId, setHasFetchedProjects]);
}
