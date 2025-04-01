import { useEffect, useState, ReactNode, FC } from "react";

/**
 * Checks if code is running on the client side
 * @returns boolean indicating if code is running in a browser
 */
export const isClient = (): boolean => {
  return typeof window !== "undefined";
};

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

/**
 * Gets a safe client-side value or fallback
 * @param clientGetter Function to get a value on the client side
 * @param fallback Fallback value to use on the server side
 * @returns The client value or fallback
 */
export function getClientSideValue<T>(clientGetter: () => T, fallback: T): T {
  if (isClient()) {
    return clientGetter();
  }
  return fallback;
}

/**
 * Hook for safely accessing localStorage with SSR support
 * @param key The localStorage key to access
 * @param initialValue The initial value to use
 * @returns [storedValue, setValue] tuple similar to useState
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Check if we're in the browser environment
  const isBrowser = useIsBrowser();

  // Initialize on mount or when key changes
  useEffect(() => {
    if (isBrowser) {
      try {
        const item = localStorage.getItem(key);
        const value = item ? JSON.parse(item) : initialValue;
        setStoredValue(value);
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        setStoredValue(initialValue);
      }
    }
  }, [isBrowser, key, initialValue]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to localStorage
      if (isBrowser) {
        localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Component for rendering content only on the client-side
 * to prevent hydration errors
 */
export const ClientOnly: FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback = null,
}) => {
  const isBrowser = useIsBrowser();

  if (!isBrowser) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
