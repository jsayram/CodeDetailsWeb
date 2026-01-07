// This file contains server-safe tier utilities without client-side code

// Define valid tier types
export type ValidTier = "free" | "pro" | "diamond";

// Define tier levels
export const TIER_LEVELS: Record<ValidTier, number> = {
  free: 0,
  pro: 1,
  diamond: 2,
};

// Export the tier hierarchy
export const TIER_HIERARCHY = TIER_LEVELS;

// Helper functions
export function isValidTier(tier: string): boolean {
  return tier in TIER_LEVELS;
}

export function canAccessTier(userTier: string, contentTier: string): boolean {
  const userLevel =
    TIER_LEVELS[isValidTier(userTier) ? (userTier as ValidTier) : "free"];
  const contentLevel =
    TIER_LEVELS[isValidTier(contentTier) ? (contentTier as ValidTier) : "free"];
  return userLevel >= contentLevel;
}

export function getAccessibleTiers(userTier: string): string[] {
  const userLevel =
    TIER_LEVELS[isValidTier(userTier) ? (userTier as ValidTier) : "free"];
  return Object.entries(TIER_LEVELS)
    .filter(([, level]) => level <= userLevel)
    .map(([tier]) => tier);
}
