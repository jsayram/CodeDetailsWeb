"use client";

import {
  UserButton,
  useUser,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";
import { Button } from "../ui/button";
import { LogIn } from "lucide-react";

export function UserProfileButton() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return null; // Only return null if still loading
  }

  return (
    <div className="ml-auto flex items-center gap-3">
      <SignedIn>
        <div className="flex items-center">
          {/* User card for medium screens and above */}
          {user && (
            <div className="hidden md:flex items-center bg-card border rounded-lg px-3 py-1.5 shadow-sm transition-all hover:shadow">
              <div className="grid text-right text-sm leading-tight mr-2">
                <span className="truncate font-medium">
                  {user.fullName || user.username}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.primaryEmailAddress?.emailAddress}
                </span>
              </div>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8 rounded-lg",
                    userButtonBox: "h-8 w-8",
                  },
                }}
              />
            </div>
          )}

          {/* Just the avatar for small screens */}
          <div className="md:hidden flex items-center">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8 w-8 rounded-lg",
                  userButtonBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button
            size="sm"
            className="rounded-lg shadow-sm hover:shadow transition-all"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}
