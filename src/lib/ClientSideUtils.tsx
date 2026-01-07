/**
 * Checks if code is running on the client side
 * @returns boolean indicating if code is running in a browser
 */
export const isClient = (): boolean => {
  return typeof window !== "undefined";
};

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

// Re-export the hooks and components from their new locations
export { useIsBrowser } from "@/hooks/use-is-browser";
export { useClientEffect } from "@/hooks/use-client-effect";
export { useLocalStorage } from "@/hooks/use-local-storage";
export { ClientOnly } from "@/components/ClientOnly";
