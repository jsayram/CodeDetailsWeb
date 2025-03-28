import React from "react";
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

interface TerminalWindowProps {
  className?: string;
  width?: string;
  height?: string;
  title?: string;
  showTrafficLights?: boolean;
  showDatetime?: boolean;
  authenticatedMessage?: string;
  unauthenticatedMessage?: string;
  links?: Array<{
    href: string;
    label: string;
  }>;
  userInfo?: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export const TerminalWindowSection: React.FC<TerminalWindowProps> = ({
  className = "",
  width = "w-full lg:w-[400px] xl:w-[500px]",
  height = "h-auto",
  title,
  showTrafficLights = true,
  showDatetime = true,
  authenticatedMessage = "Select an option to continue.",
  unauthenticatedMessage = "Welcome to Code Details Terminal. AUTHENTICATE TO CONTINUE",
  links = [
    { href: "#", label: "Learn" },
    { href: "#", label: "Implement" },
    { href: "#", label: "Deploy" },
  ],
  userInfo,
}) => {
  // Get the user info if not provided as prop
  const { user: clerkUser } = useUser();

  // Handle Clerk user email address properly
  const userEmail =
    userInfo?.email || clerkUser?.primaryEmailAddress?.emailAddress || null;

  const userName = userInfo?.firstName || clerkUser?.firstName || "user";

  // Construct terminal title based on user information
  const displayTitle =
    title ||
    (userEmail
      ? `${userName}@codedetails ~ /home/${userEmail.split("@")[0]}`
      : "guest@codedetails ~ /terminal");

  return (
    <div
      className={`relative rounded-lg overflow-hidden border border-border/50 shadow-xl bg-black backdrop-blur-md transform transition-all duration-300 ${width} ${height} ${className}`}
    >
      {/* Window Header */}
      <div className="h-8 bg-gray-800/90 flex items-center px-4">
        {/* Traffic Light Buttons */}
        {showTrafficLights && (
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        )}

        {/* Terminal Title with user email */}
        <div className="flex-1 text-center text-xs text-gray-400 font-mono">
          {displayTitle}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-4 lg:p-6 font-mono text-sm">
        {/* Datetime - conditional */}
        {showDatetime && (
          <div className="text-gray-500 mb-1">
            Last login: {new Date().toLocaleDateString()}{" "}
            {new Date().toLocaleTimeString()}
          </div>
        )}

        <SignedOut>
          {/* Show sign in message for unauthenticated users */}
          <div className="space-y-4">
            <div className="text-gray-500 mb-3">{unauthenticatedMessage}</div>

            <div className="relative group">
              <div className="flex items-center">
                <span className="text-green-400 mr-2">$</span>
                <SignInButton mode="modal">
                  <div className="flex items-center text-xl font-bold relative bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400 hover:from-blue-400 hover:to-green-400 transition-all duration-300 cursor-pointer">
                    {">_ Sign In"}
                  </div>
                </SignInButton>

                <span
                  className="ml-1 inline-block h-5 w-[8px] bg-transparent border-b-2 border-white/70 group-hover:border-primary animate-pulse"
                  style={{ animationDuration: "1s" }}
                ></span>
              </div>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Show greeting with user's name if available */}
          <div className="text-gray-500 mb-3">
            {`Hello ${userName}! ${authenticatedMessage}`}
          </div>

          {/* Links styled as terminal commands */}
          <div className="space-y-4">
            {links.map((link, index) => (
              <div key={index} className="relative group">
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">$</span>
                  <Link
                    href={link.href}
                    className="flex items-center text-xl font-bold relative bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400 hover:from-blue-400 hover:to-green-400 transition-all duration-300"
                  >
                    {`>_ ${link.label}`}
                    <span
                      className="absolute inset-0"
                      aria-hidden="true"
                    ></span>
                  </Link>
                  <span
                    className="ml-1 inline-block h-5 w-[8px] bg-transparent border-b-2 border-transparent group-hover:border-primary/70 animate-pulse"
                    style={{ animationDuration: "1s" }}
                  ></span>
                </div>
              </div>
            ))}
          </div>
        </SignedIn>
      </div>
    </div>
  );
};
