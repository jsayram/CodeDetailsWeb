"use client";

import {
  isSystemDarkMode,
  useSystemDarkMode,
  useSystemDarkModeListener,
  useThemeManager,
} from "@/hooks/use-theme";

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

// Re-export the hooks for backward compatibility
export {
  isSystemDarkMode,
  useSystemDarkMode,
  useSystemDarkModeListener,
  useThemeManager,
};
