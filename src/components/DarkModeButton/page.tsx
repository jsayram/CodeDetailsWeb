import React, { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export const DarkModeButton = ({ isMobile = false }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <div className={`flex items-center gap-2 ${isMobile ? "scale-90" : ""}`}>
      <div
        onClick={() => setTheme(isDark ? "light" : "dark")}
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
      <div className="relative w-5 h-5 transition-transform duration-300 hover:scale-110">
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
