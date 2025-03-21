import { useSession } from '@clerk/nextjs';
import { useEffect, useState, useCallback } from 'react';

/**
 * Hook to get and manage the Supabase JWT token from Clerk
 * @returns Object containing token, loading state, and error
 */
export function useSupabaseToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useSession();

  const fetchToken = useCallback(async () => {
    if (!session) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const newToken = await session.getToken({ template: 'supabase' });
      setToken(newToken);
      return newToken;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching token');
      console.error('Error getting token from Clerk:', error);
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Fetch token on session change
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return {
    token,
    loading,
    error,
    refreshToken: fetchToken
  };
}