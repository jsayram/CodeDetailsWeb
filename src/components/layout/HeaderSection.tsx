"use client";

import React, { useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { DarkModeButton } from "@/components/DarkModeButton/page";
import { Logo } from "../Logo/page";

export function HeaderSection() {
  // const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showDebug = process.env.NODE_ENV === "development";

  return (
    <header className="sticky top-0 bottom-4 z-50 border-b bg-transparent mx-7 my-4">
      <div className="container mx-auto py-4 md:py-3">
        {/* Fixed top bar that won't be affected by transitions */}
        <div className="flex items-center justify-between">
          {/* Logo - now wrapped in memo to prevent re-renders */}
          <div className="flex items-center hover:scale-102 z-20 transition-transform ">
            <Logo
              size="md"
              className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-primary mx-auto text-center"
              showText={true}
              showTagline={false}
              href="/"
              mainLogoText="code.{ d }"
              tagLineText="The More You Know"
              showLogo={false}
            />
          </div>
          {/* Mobile controls */}
          {/* <div className="flex items-center space-x-3 md:hidden z-5">
            
            <DarkModeButton isMobile={true} />

           
            <button
              className="p-2 rounded-md hover:bg-muted/10 transition-colors h-10 w-10 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div> */}

          {/* Desktop navigation */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <DarkModeButton />

            {/* Auth section */}
            <div className="flex items-center">
              <SignedIn>
                <div className="flex items-center">
                  {showDebug && (
                    <div className="hidden lg:block">
                      {/* <DebugJwt token={token} /> */}
                    </div>
                  )}
                  <UserButton
                    // afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-9 h-9",
                      },
                    }}
                  />
                </div>
              </SignedIn>

              <SignedOut>
                <SignInButton mode="modal">
                  {/* Apply the glow effect wrapper */}
                  <div className="relative group inline-block">
                    {/* Glow effect */}
                    <div
                      className="absolute transition-all duration-1000 opacity-70 inset-0 
                   bg-gradient-to-r from-primary/40 to-secondary/40 
                   rounded-lg blur-lg filter 
                   group-hover:opacity-100 group-hover:duration-200
                   -z-10 -m-1"
                    ></div>

                    <Button
                      size="sm"
                      className="relative hover:scale-105 transition-transform"
                    >
                      Sign In
                    </Button>
                  </div>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>

        {/* Mobile menu - with absolute positioning */}
        {/* <div
          className={`sm:hidden absolute left-0 right-0 bg-background z-10 border-b transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-full pointer-events-none"
          }`}
          style={{
            top: "calc(100% + 1px)",
            boxShadow: mobileMenuOpen
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              : "none",
          }}
        >
          <div className="container mx-auto py-4">
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
        </div> */}
      </div>
    </header>
  );
}
