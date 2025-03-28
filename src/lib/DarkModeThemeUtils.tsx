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

  // First check if we're in a browser environment
  if (typeof window === "undefined") {
    console.warn(
      "isSystemDarkMode was called in a non-browser environment - defaulting to light mode"
    );
    return false;
  }

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

    // Optional: Add a listener for preference changes
    // This doesn't affect the current return value but allows for monitoring changes
    try {
      // Only set up the listener if it's not already set
      if (typeof darkModeQuery.addEventListener === "function") {
        // Modern browsers
        darkModeQuery.addEventListener("change", (e) => {
          console.log(
            `System theme preference changed to: ${
              e.matches ? "dark" : "light"
            } mode`
          );
        });
      } else if (typeof darkModeQuery.addListener === "function") {
        // Older browsers
        darkModeQuery.addListener((e) => {
          console.log(
            `System theme preference changed to: ${
              e.matches ? "dark" : "light"
            } mode`
          );
        });
      }
    } catch (listenerError) {
      console.warn("Failed to set up theme change listener:", listenerError);
      // This is not critical, so we continue
    }

    return isDarkMode;
  } catch (error) {
    // If anything goes wrong, log the error and default to light mode
    console.error("Error detecting system dark mode preference:", error);
    return false;
  }
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
