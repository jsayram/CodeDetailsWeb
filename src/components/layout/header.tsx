'use client'

import React, { useCallback } from 'react'
import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton } from '@clerk/nextjs'
import { MoonIcon, SunIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useSupabaseToken } from '@/services/clerkService'
import dynamic from 'next/dynamic'

// Only load DebugJwt in development
const DebugJwt = process.env.NODE_ENV === 'development' 
  ? dynamic(() => import('@/components/debug/page').then(mod => mod.DebugJwt), { ssr: false })
  : () => null

export default function Header() {
  const { theme, setTheme } = useTheme()
  const { token } = useSupabaseToken()
  
  // Memoize the theme toggle handler to prevent re-renders on every theme change
  const handleThemeToggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 px-6">
      <div className="container flex justify-between items-center">
        <h1 className="text-2xl font-bold">Code Details</h1>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleThemeToggle}
            aria-label="Toggle theme"
          >
            <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          <SignedIn>
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
              {process.env.NODE_ENV === 'development' && <DebugJwt token={token} />}
              <SignOutButton>
                <Button variant="outline" size="sm">Sign Out</Button>
              </SignOutButton>
            </div>
          </SignedIn>
          
          <SignedOut>
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  )
}