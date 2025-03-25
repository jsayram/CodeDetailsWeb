"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
} from "@clerk/nextjs";
import { MoonIcon, SunIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useSupabaseToken } from "@/services/clerkService";
import Link from "next/link";
import { DarkModeButton } from "@/components/DarkModeButton/page";

export default function Header() {
  const { token } = useSupabaseToken();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showDebug = process.env.NODE_ENV === "development";

  return (
    <header className="sticky mt-4 mb-4 top-0 bottom-4 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 md:py-3">
        <div className="flex items-center justify-between">
          {/* Logo - clickable and responsive */}
          <Link
            href="/"
            className="flex items-center space-x-2 transition-transform hover:scale-105"
          >
            <h1 className="text-xl font-bold sm:text-2xl">Code Details</h1>
          </Link>

          {/* Mobile controls */}
          <div className="flex items-center space-x-3 md:hidden">
            {/* Mobile dark mode toggle */}
            <DarkModeButton isMobile={true} />

            {/* Mobile menu button */}
            <button
              className="p-2 rounded-md hover:bg-muted/80 transition-colors h-10 w-10 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Theme toggle */}
            <DarkModeButton />

            {/* Auth section */}
            <div className="flex items-center">
              <SignedIn>
                <div className="flex items-center gap-4">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-9 h-9",
                      },
                    }}
                  />

                  {showDebug && (
                    <div className="hidden lg:block">
                      {/* <DebugJwt token={token} /> */}
                    </div>
                  )}

                  <SignOutButton>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:scale-105 transition-transform"
                    >
                      Sign Out
                    </Button>
                  </SignOutButton>
                </div>
              </SignedIn>

              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    size="sm"
                    className="hover:scale-105 transition-transform"
                  >
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>

        {/* Mobile menu - improved slide down animation */}
        <div
          className={`md:hidden transition-all duration-500 overflow-hidden ease-in-out ${
            mobileMenuOpen
              ? "max-h-96 opacity-100 mt-4 border-t pt-4"
              : "max-h-0 opacity-0 border-t-0"
          }`}
        >
          <div className="flex flex-col space-y-4 items-center text-center">
            <div className="w-full max-w-xs flex flex-col items-center space-y-3">
              <SignedIn>
                <div className="flex flex-col items-center gap-3 w-full">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-10 h-10",
                      },
                    }}
                  />
                  <SignOutButton>
                    <Button variant="outline" size="sm" className="w-full">
                      Sign Out
                    </Button>
                  </SignOutButton>
                </div>
              </SignedIn>

              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="sm" className="w-full">
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
