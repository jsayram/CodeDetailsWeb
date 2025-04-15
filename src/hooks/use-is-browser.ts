import { useEffect, useState } from "react";

/**
 * Hook to safely detect browser environment after hydration
 * @returns boolean indicating if component is mounted in browser
 */
export function useIsBrowser(): boolean {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  return isBrowser;
}
