import { useEffect, useRef } from "react";

/**
 * Custom hook to track user tier changes
 */
export function useTierTracker(
  isAuthenticated: boolean,
  isLoading: boolean,
  userTier: string,
  setHasFetchedProjects: React.Dispatch<React.SetStateAction<boolean>>
) {
  // Track tier changes
  const previousTierRef = useRef<string>("");

  // Track tier changes and trigger refetch when needed
  useEffect(() => {
    // Skip if not authenticated or parent is still loading
    if (!isAuthenticated || isLoading) return;

    console.log("🎫 Tier check: current=" + userTier);

    // Check for tier changes
    if (previousTierRef.current && previousTierRef.current !== userTier) {
      console.log(
        "🔄 Tier changed from",
        previousTierRef.current,
        "to",
        userTier
      );
      // Force refetch when tier changes
      setHasFetchedProjects(false);
    } else if (previousTierRef.current === userTier) {
      console.log("✅ Tier loaded:", userTier);
    } else {
      console.log("🔄 Initial tier loaded:", userTier, ", triggering fetch");
    }

    // Update tier ref
    previousTierRef.current = userTier;
  }, [userTier, isAuthenticated, isLoading, setHasFetchedProjects]);
}
