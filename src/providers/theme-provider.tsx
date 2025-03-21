"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // prevent hydration mismatch
  const [mounted, setMounted] = useState(false)

  // Only after the component is mounted, we can render the children
  useEffect(() => {
    setMounted(true)
  }, [])

  // Return null or a simple placeholder during SSR
  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}