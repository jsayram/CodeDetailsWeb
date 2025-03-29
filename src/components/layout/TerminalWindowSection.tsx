import React from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { TextTypingEffectAnimation } from "@/animations/TextTypingEffectAnimation";
import {
  useIsBrowser,
  ClientOnly,
  getClientSideValue,
} from "@/utils/ClientSideUtils";

// Screen size type for visibility control
type ScreenSize = "all" | "mobile" | "sm" | "md" | "lg" | "xl" | "2xl";

interface TerminalLink {
  href: string;
  label: string;
  clickable?: boolean;
  className?: string;
  textColor?: string;
  hoverColor?: string;
  style?: React.CSSProperties;
  // New property for responsive visibility
  visibleOn?: ScreenSize[] | "all";
}

interface TerminalWindowProps {
  className?: string;
  width?: string;
  height?: string;
  title?: string;
  showTrafficLights?: boolean;
  showDatetime?: boolean;
  authenticatedMessage?: string;
  unauthenticatedMessage?: string;
  links?: Array<TerminalLink>;
  userInfo?: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export const TerminalWindowSection: React.FC<TerminalWindowProps> = ({
  className = "text-gray-400 cursor-text",
  width = "w-full lg:w-[400px] xl:w-[500px]",
  height = "h-auto",
  title,
  showTrafficLights = true,
  showDatetime = true,
  authenticatedMessage = "Select an option to continue.",
  unauthenticatedMessage = "Welcome to Code Details Terminal. AUTHENTICATE TO CONTINUE",
  links = [
    // Funny non-clickable "decoration" commands
    { href: "#", label: "man how-to-be-a-developer", clickable: false },
    {
      href: "#",
      label: "curl -s https://stackoverflow.com/all-answers.json",
      clickable: false,
    },
    {
      href: "#",
      label: "terraform destroy --auto-approve --its-friday-5pm",
      clickable: false,
    },
    // Actual navigation links
    { href: "/learn", label: "Learn", clickable: true },
  ],
  userInfo,
}) => {
  // Get the user info if not provided as prop
  const { user: clerkUser } = useUser();
  const isBrowser = useIsBrowser();

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

  // Get date time values safely for SSR
  const currentTimestamp = getClientSideValue(() => Date.now(), 0);

  // Helper function to generate responsive visibility classes
  const getVisibilityClasses = (
    visibleOn: TerminalLink["visibleOn"]
  ): string => {
    if (!visibleOn || visibleOn === "all") return "";

    // Start with hidden by default
    let classes = "hidden";

    // Add display classes for specified breakpoints
    if (Array.isArray(visibleOn)) {
      visibleOn.forEach((size) => {
        if (size === "mobile") {
          classes += " xs:flex"; // Visible on base mobile (below sm)
        } else if (size !== "all") {
          classes += ` ${size}:flex`; // Example: md:flex
        }
      });
    }

    return classes;
  };

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
        {/* Datetime - conditional & safe for SSR */}
        {showDatetime && (
          <ClientOnly
            fallback={<div className="text-gray-500 mb-1">Last login: ...</div>}
          >
            <div className="text-gray-500 mb-1">
              Last login: {new Date(currentTimestamp).toLocaleDateString()}{" "}
              {new Date(currentTimestamp).toLocaleTimeString()}
            </div>
          </ClientOnly>
        )}

        <SignedOut>
          {/* Show sign in message for unauthenticated users */}
          <div className="space-y-4">
            <div className="text-gray-500 mb-3">{unauthenticatedMessage}</div>

            <div className="relative group">
              <div className="flex items-center">
                <span className="text-green-400 mr-2">$</span>
                <SignInButton mode="modal">
                  <div className="flex items-center text-xl font-bold relative bg-clip-text text-transparent bg-gradient-to-r from-lime-500 to-green-500 hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 cursor-pointer">
                    {">_"}
                    <TextTypingEffectAnimation
                      className="text-xl font-medium"
                      text={"Sign In"}
                    />
                  </div>
                </SignInButton>
                {/* Flat blinking cursor (underscore style) - safe for SSR */}
                <ClientOnly>
                  <span
                    className="ml-1 inline-block h-[2px] w-[10px] bg-white/70 group-hover:bg-primary/90 mt-4 animate-pulse"
                    style={{ animationDuration: "1s" }}
                  ></span>
                </ClientOnly>
              </div>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Show greeting with user's name if available */}
          <div className="text-fuchsia-400 mb-3 font-medium">
            {`Hello ${userName}! ${authenticatedMessage}`}
          </div>

          {/* Links styled as terminal commands */}
          <div className="space-y-4">
            {links.map((link, index) => (
              <div
                key={index}
                className={`relative group ${getVisibilityClasses(
                  link.visibleOn
                )}`}
              >
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">$</span>

                  {/* Conditional rendering based on clickable property */}
                  {link.clickable !== false ? (
                    <>
                      <Link
                        href={link.href}
                        className={`flex items-center text-xl font-bold relative bg-clip-text text-transparent bg-gradient-to-r from-lime-500 to-green-500 hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 ${
                          link.className || ""
                        }`}
                        style={{
                          ...link.style,
                          color: link.textColor,
                        }}
                      >
                        {">_ "}
                        <TextTypingEffectAnimation
                          className="text-xl font-medium"
                          skipOnRerender={true}
                          text={link.label}
                        />
                        <span
                          className="absolute inset-0"
                          aria-hidden="true"
                        ></span>
                      </Link>

                      {/* Flat blinking cursor ONLY for clickable items */}
                      <ClientOnly>
                        <span
                          className="ml-1 inline-block h-[2px] w-[10px] bg-transparent group-hover:bg-green-400/70 mt-4 animate-pulse"
                          style={{ animationDuration: "1s" }}
                        ></span>
                      </ClientOnly>
                    </>
                  ) : (
                    <div
                      className={`flex items-center text-xl font-bold transition-all duration-300 cursor-text ${
                        link.className ||
                        "text-gray-500 group-hover:text-gray-400"
                      }`}
                      style={{
                        ...link.style,
                        color: link.textColor || undefined,
                      }}
                    >
                      {">_ "}
                      <TextTypingEffectAnimation
                        className="text-xl font-medium"
                        skipOnRerender={true}
                        text={link.label}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SignedIn>
      </div>
    </div>
  );
};
