"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

interface SWRProviderProps {
  children: ReactNode;
}

/**
 * Global SWR configuration provider
 * Wraps the app to provide consistent caching behavior
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Don't revalidate on window focus (user controls refresh)
        revalidateOnFocus: false,
        // Don't revalidate on reconnect
        revalidateOnReconnect: false,
        // Dedupe requests within 60 seconds
        dedupingInterval: 60000,
        // Retry failed requests up to 3 times
        errorRetryCount: 3,
        // Keep previous data while revalidating
        keepPreviousData: true,
        // Default fetcher for API routes
        fetcher: async (url: string) => {
          const res = await fetch(url);
          if (!res.ok) {
            const error = new Error("An error occurred while fetching the data.");
            throw error;
          }
          return res.json();
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
