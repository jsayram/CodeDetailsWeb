"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Prevent hydration mismatch with SSR
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render children until mounted to prevent theme flash
  if (!mounted) {
    // Return a placeholder with same DOM structure to prevent layout shifts
    return (
      <div 
        style={{ visibility: "hidden" }}
        aria-hidden="true"
        suppressHydrationWarning
      >
        {children}
      </div>
    );
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
