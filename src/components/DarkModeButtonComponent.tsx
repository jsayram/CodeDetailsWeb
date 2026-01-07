"use client";
import React, { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { isSystemDarkMode } from "@/lib/DarkModeThemeUtils";

export const DarkModeButton = ({ isMobile = false }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference on mount
    const systemPreference = isSystemDarkMode();
    
    // Set initial state based on system preference or saved theme
    if (theme === "system") {
      setIsDark(systemPreference);
    } else {
      setIsDark(theme === "dark");
    }
    
    setMounted(true);
  }, [theme]);

  // Update dark mode state when theme changes
  useEffect(() => {
    if (mounted) {
      setIsDark(resolvedTheme === "dark");
    }
  }, [resolvedTheme, mounted]);

  // Render placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return <div className={`h-6 w-12 rounded-full bg-gray-300 ${isMobile ? "scale-90" : ""}`} />;
  }

  return (
    <div className={`flex items-center gap-2 ${isMobile ? "scale-90" : ""}`}>
      <div
        onClick={() => setTheme(isDark ? "light" : "dark")}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
        className={`relative h-6 w-12 rounded-full transition-all duration-300 cursor-pointer ${
          isDark
            ? "bg-indigo-900/70 hover:bg-indigo-800/80"
            : "bg-amber-100 hover:bg-amber-200/90"
        } hover:shadow-md hover:scale-105`}
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle theme"
      >
        <div
          className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full shadow-md transform transition-all duration-500 ${
            isDark
              ? "bg-indigo-400 translate-x-6 hover:bg-indigo-300"
              : "bg-amber-400 translate-x-0 hover:bg-amber-300"
          }`}
        />
      </div>
      <div
        className="relative w-5 h-5 transition-transform duration-300 hover:scale-110"
        title={isDark ? "Dark mode active" : "Light mode active"}
      >
        {/* Sun icon - visible in light mode */}
        <SunIcon
          className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${
            isDark
              ? "opacity-0 rotate-90 scale-0"
              : "opacity-100 rotate-0 scale-100 text-amber-500 hover:text-amber-400"
          }`}
        />
        {/* Moon icon - visible in dark mode */}
        <MoonIcon
          className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${
            isDark
              ? "opacity-100 rotate-0 scale-100 text-indigo-400 hover:text-indigo-300"
              : "opacity-0 -rotate-90 scale-0"
          }`}
        />
      </div>
    </div>
  );
};