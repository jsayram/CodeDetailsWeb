import { useState, useEffect, useCallback } from 'react';

// Define valid tier types
export type ValidTier = 'free' | 'pro' | 'diamond';

 //Centralized tier system configuration higher number means higher tier that includes all lower tiers
const TierSystem = {
    levels: {
      'free': 0,
      'pro': 1,
      'diamond': 2
    } as Record<ValidTier, number>,
    
    /**
     * Safely gets the level of a tier, defaulting to 'free' for invalid tiers
     */
    getLevel(tier: string): number {
      const validTier = this.isValidTier(tier) ? tier as ValidTier : 'free';
      return this.levels[validTier];
    },
    
    /**
     * Checks if a tier string is a valid tier in our system
     */
    isValidTier(tier: string): boolean {
      return tier in this.levels;
    },
    
    /**
     * Checks if one tier can access content from another tier
     */
    canAccess(userTier: string, contentTier: string): boolean {
      return this.getLevel(userTier) >= this.getLevel(contentTier);
    },
    
    /**
     * Gets all tiers accessible to a user with the given tier
     */
    getAccessibleTiers(userTier: string): string[] {
      const userLevel = this.getLevel(userTier);
      return Object.entries(this.levels)
        .filter(([_, level]) => level <= userLevel)
        .map(([tier, _]) => tier);
    }
  };
  
/**
 * Return type for the useUserTier hook
 */
type UserTierResult = {
    userTier: ValidTier;     // Current subscription tier
    loading: boolean;        // If tier is being fetched
    error: string | null;    // Error message if fetch failed
    refreshUserTier: () => Promise<void>; // Manual refresh function
  };

// Interface for a client that can fetch tier data from database
interface TierRpcClient {
    rpc: (functionName: string, params: Record<string, any>) => Promise<{
        data: any;
        error: { message: string } | null;
    }>;
}

/**
 * React hook that fetches a user's subscription tier from Supabase.
 * 
 * This hook connects to Supabase and calls a stored database function 'get_user_tier'
 * which is defined in your Supabase instance. The stored function handles the database
 * query logic to retrieve the user's current subscription level from profiles table.
 * 
 * Flow:
 * 1. Hook receives an authenticated Supabase client and userId
 * 2. It calls the RPC function 'get_user_tier' in Supabase
 * 3. The database function returns the user's tier (free, pro, diamond)
 * 4. The hook validates the tier value and sets the state
 * 
 * @param client - An authenticated Supabase client with permission to call the RPC function
 * @param userId - The current user's ID, used to look up their tier in the database
 * @returns {UserTierResult} Object containing the user's tier, loading state, error, and refresh function
 */
export function useUserTier(client: TierRpcClient | null,  userId: string | null): UserTierResult {
    // Default to 'free' tier until we get data from database
    const [userTier, setUserTier] = useState<ValidTier>('free');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Function that calls the Supabase stored procedure 'get_user_tier'
     * 
     * The database function (get_user_tier) is responsible for:
     * - Looking up the user in the profiles table using user_id_param
     * - Returning their current subscription tier
     * - Handling any database-level permission checks or joins
     */
    const fetchUserTier = useCallback(async () => {
        // Don't attempt to fetch if missing client or userId
        if (!client || !userId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Call the Supabase RPC function 'get_user_tier' defined in your database
            // This is a stored procedure that retrieves the user's tier from profiles table
            const { data, error } = await client
                .rpc('get_user_tier', { user_id_param: userId });
            
            // Handle database errors (like permissions, function not found, etc.)
            if (error) {
                console.error('Error fetching user tier:', error);
                setError(`Error fetching tier: ${error.message}`);
                return;
            }
            
            if (data) {
                // Validate tier value returned from database
                if (data === 'free' || data === 'pro' || data === 'diamond') {
                    console.log(`User tier from database: ${data}`);
                    setUserTier(data as ValidTier);
                } else {
                    // Handle unexpected tier values from database
                    console.warn(`Unknown tier value: ${data}, defaulting to 'free'`);
                    setUserTier('free');
                }
            } else {
                // No tier found for user, default to free tier
                console.log('No tier data found, using default tier: free');
            }
        } catch (err) {
            // Handle unexpected errors (network, parsing, etc.)
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('Failed to fetch user tier:', errorMessage);
            setError(`Failed to fetch tier: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, [client, userId]);

    // Execute tier fetch when component mounts or when client/userId changes
    useEffect(() => {
        fetchUserTier();
    }, [fetchUserTier]);

    return {
        userTier,        // The current tier (free, pro, diamond)
        loading,         // Whether the tier is currently being fetched
        error,           // Any error that occurred during fetching
        refreshUserTier: fetchUserTier  // Function to manually refresh the tier
    };
}

// Export the hierarchy for direct access if needed
export const TIER_HIERARCHY = TierSystem.levels;

// Export user-facing functions that use the tier system
export const canAccessTier = TierSystem.canAccess.bind(TierSystem);
export const getAccessibleTiers = TierSystem.getAccessibleTiers.bind(TierSystem);
export const isValidTier = TierSystem.isValidTier.bind(TierSystem);