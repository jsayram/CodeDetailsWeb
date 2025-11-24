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
import { DarkModeButton } from "@/components/DarkModeButtonComponent";
import { Logo } from "@/components/CodeDetailsLogoComponent";
import { Menu } from "lucide-react";
import { SignInButtonComponent } from "../auth/SignInButtonComponent";

// Define the breadcrumb item interface
interface BreadcrumbItemData {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface HeaderSectionProps {
  isSticky?: boolean; // Control sticky behavior
  showDarkModeButton?: boolean; // Control dark mode button visibility
  showLogo?: boolean; // Control logo visibility
  showMobileMenu?: boolean; // Enable responsive mobile menu
  showSignInButton?: boolean; // Control sign-in button visibility
  className?: string; // Additional classes
  breadcrumbs?: BreadcrumbItemData[]; // Dynamic breadcrumbs
}

export function HeaderSectionNoSideBar({
  showDarkModeButton = true,
  showLogo = true,
  showMobileMenu = true, // Default to showing mobile menu on small screens
  showSignInButton = true, // Default to showing sign-in button
}: HeaderSectionProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showDebug = process.env.NODE_ENV === "development";

  return (
    <header className="sticky top-5 z-50 border-b bg-background mx-7 mb-5">
      {/* Fixed top bar that won't be affected by transitions - available for all users */}
      <div className="container mx-auto py-4 md:py-3">
        {/* Fixed top bar that won't be affected by transitions */}
        <div className="flex items-center justify-between">
          {/* Logo section - always maintain space even when logo is hidden */}
          <div className="flex items-center">
            {showLogo ? (
              <div className="flex items-center hover:scale-102 z-20 transition-transform">
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
            ) : (
              <div className="w-8"></div> // placeholder for logo space if hidden
            )}
          </div>

          {/* Right side items - always on the right */}
          <div className="flex items-center space-x-4">
            {/* Dark mode toggle - always visible if enabled */}
            {showDarkModeButton && <DarkModeButton />}

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
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-9 h-9",
                      },
                    }}
                  />
                </div>
              </SignedIn>

              <SignedOut>
                {/* Sign In button - conditionally visible based on showMobileMenu and showSignInButton */}
                {showSignInButton && (
                  <div className={showMobileMenu ? "hidden sm:block" : "block"}>
                    <SignInButtonComponent text="Sign In" useTypingEffect={false} variant="plain" />
                  </div>
                )}
              </SignedOut>
            </div>

            {/* Hamburger menu button - only visible on small screens if enabled */}
            {showMobileMenu && (
              <button
                className="p-2 rounded-md hover:bg-muted/10 transition-colors h-10 w-10 flex items-center justify-center sm:hidden cursor-pointer"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu - conditionally rendered and only visible on small screens */}
        {showMobileMenu && (
          <div
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
                     <SignInButtonComponent text="Sign In" useTypingEffect={false} variant="plain" />
                  </SignedOut>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
