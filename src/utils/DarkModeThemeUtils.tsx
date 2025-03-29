"use client";
import { useEffect, useState } from "react";
import {
  getClientSideValue,
  useClientEffect,
  useIsBrowser,
} from "./ClientSideUtils";

/**
 * Determines if the user's system is set to dark mode preference.
 *
 * This function checks the user's system preferences using the matchMedia API
 * to determine if they have enabled dark mode at the OS/browser level.
 *
 * @returns {boolean} True if system preference is dark mode, false if light mode or if detection fails
 */
export function isSystemDarkMode(): boolean {
  console.log("Checking system dark mode preference...");

  // Use getClientSideValue instead of direct window check
  return getClientSideValue(() => {
    try {
      // Check if the browser supports matchMedia API
      if (!window.matchMedia) {
        console.warn(
          "Browser doesn't support matchMedia API - defaulting to light mode"
        );
        return false;
      }

      // Create the media query for dark mode preference
      const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

      // Get the match result
      const isDarkMode = darkModeQuery.matches;

      console.log(
        `System dark mode preference detected: ${
          isDarkMode ? "dark" : "light"
        } mode`
      );

      return isDarkMode;
    } catch (error) {
      // If anything goes wrong, log the error and default to light mode
      console.error("Error detecting system dark mode preference:", error);
      return false;
    }
  }, false); // Default to false (light mode) on server
}

/**
 * Hook to monitor system dark mode preference changes
 * @param {Function} onChange - Callback function when preference changes
 */
export function useSystemDarkModeListener(
  onChange: (isDarkMode: boolean) => void
): void {
  useClientEffect(() => {
    try {
      const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

      // Set up listener based on browser support
      const changeHandler = (e: MediaQueryListEvent) => {
        console.log(
          `System theme preference changed to: ${
            e.matches ? "dark" : "light"
          } mode`
        );
        onChange(e.matches);
      };

      if (typeof darkModeQuery.addEventListener === "function") {
        // Modern browsers
        darkModeQuery.addEventListener("change", changeHandler);
        return () => darkModeQuery.removeEventListener("change", changeHandler);
      } else if (typeof darkModeQuery.addListener === "function") {
        // Older browsers
        darkModeQuery.addListener(changeHandler);
        return () => darkModeQuery.removeListener(changeHandler);
      }
    } catch (listenerError) {
      console.warn("Failed to set up theme change listener:", listenerError);
    }
  }, [onChange]);
}

/**
 * Hook to get and monitor system dark mode preference
 * @returns {boolean} Current system dark mode preference
 */
export function useSystemDarkMode(): boolean {
  const isBrowser = useIsBrowser();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize on mount
  useEffect(() => {
    if (isBrowser) {
      setIsDarkMode(isSystemDarkMode());
    }
  }, [isBrowser]);

  // Set up listener for changes
  useSystemDarkModeListener(setIsDarkMode);

  return isDarkMode;
}

/**
 * Provides a safe way to get the current theme accounting for system preference.
 *
 * @param {string | null | undefined} currentTheme - The current theme setting ('dark', 'light', 'system', or null/undefined)
 * @returns {string} 'dark' or 'light' based on the current theme or system preference
 */
export function getEffectiveTheme(
  currentTheme?: string | null
): "dark" | "light" {
  console.log(
    `Getting effective theme from current setting: ${currentTheme || "not set"}`
  );

  // If theme is explicitly set to dark or light, use that
  if (currentTheme === "dark") return "dark";
  if (currentTheme === "light") return "light";

  // If theme is set to system or not set at all, use system preference
  if (currentTheme === "system" || !currentTheme) {
    const systemPrefersDark = isSystemDarkMode();
    console.log(
      `Using system preference: ${systemPrefersDark ? "dark" : "light"}`
    );
    return systemPrefersDark ? "dark" : "light";
  }

  // If we somehow get an invalid theme value, default to light
  console.warn(
    `Unexpected theme value: ${currentTheme}, defaulting to light mode`
  );
  return "light";
}

/**
 * Hook for theme management with system preference support
 * @param {string} initialTheme - Initial theme setting ('dark', 'light', 'system')
 * @returns {[string, (theme: string) => void, string]} Current theme setting, setter function, and effective theme
 */
export function useThemeManager(
  initialTheme: string = "system"
): [string, (theme: string) => void, "dark" | "light"] {
  const [theme, setTheme] = useState(initialTheme);
  const systemIsDark = useSystemDarkMode();

  // Calculate effective theme (what's actually applied)
  const effectiveTheme: "dark" | "light" =
    theme === "dark"
      ? "dark"
      : theme === "light"
      ? "light"
      : systemIsDark
      ? "dark"
      : "light";

  return [theme, setTheme, effectiveTheme];
}
