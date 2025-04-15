import { useEffect, useState } from "react";

/**
 * Hook to safely execute code only on the client side after hydration
 * @param callback Function to execute on the client side
 * @param deps Dependency array for the effect
 */
export function useClientEffect(
  callback: () => void | (() => void),
  deps: React.DependencyList = []
) {
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Use the useEffect hook directly with the provided callback and deps
  useEffect(() => {
    // Only run the callback if the component is mounted
    if (isMounted) {
      return callback();
    }
    // Using a custom comparator for deps - this avoids the spread in the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, callback, ...deps]);
}
