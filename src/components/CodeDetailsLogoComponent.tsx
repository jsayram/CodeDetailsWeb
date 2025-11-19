"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";

interface LogoProps {
  showText?: boolean;
  showLogo?: boolean;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  taglineSize?: "2xs" | "xs" | "sm" | "md" | "lg";
  href?: string;
  className?: string;
  tagLineText?: string;
  mainLogoText?: string;
}

export function Logo({
  showText = true,
  showTagline = true,
  showLogo = true,
  size = "sm",
  taglineSize = "2xs",
  href = "/",
  className = "",
  tagLineText = "Learn, Build, Repeat",
  mainLogoText = "Code Details",
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  // Size mappings for logo and main text
  const sizeMap = {
    sm: { logo: "h-6 w-6", text: "text-lg" },
    md: { logo: "h-8 w-8", text: "text-xl md:text-2xl" },
    lg: { logo: "h-10 w-10", text: "text-2xl md:text-3xl" },
  };

  // Separate mapping for tagline sizes
  const taglineSizeMap = {
    "2xs": "text-[10px]",
    xs: "text-xs",
    sm: "text-sm",
    md: "text-default",
    lg: "text-lg",
  };

  // Simplified logo implementation to prevent flickering
  const LogoIcon = ({ className = "" }) => (
    <div className={`relative ${className}`}>
      {/* Single image with priority loading */}
      <Image
        src="/images/CodeDetails_IconLogo.png"
        alt="Code Details Logo"
        width={40}
        height={40}
        priority={true}
        className="transition-all duration-100"
      />
    </div>
  );

  const logoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute inset-0 rounded-2xl ${
            isDarkMode
              ? "bg-gradient-to-r from-blue-500 to-purple-400"
              : "bg-gradient-to-r from-blue-300 to-purple-200"
          }`}
          style={{
            boxShadow: isDarkMode
              ? "0 0 10px rgba(59, 130, 246, 0.3)"
              : "0 0 8px rgba(59, 130, 246, 0.2)",
          }}
        />
        {showLogo && (
          <LogoIcon className={`relative z-10 ${sizeMap[size].logo}`} />
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-bold leading-none tracking-tight ${sizeMap[size].text}`}
          >
            {mainLogoText}
          </span>
          {showTagline && (
            <span
              className={`hidden text-muted-foreground sm:block ${taglineSizeMap[taglineSize]}`}
            >
              {tagLineText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  // Return with or without link wrapper based on href
  return href ? (
    <Link href={href} className="focus:outline-none cursor-pointer">
      {logoContent}
    </Link>
  ) : (
    logoContent
  );
}
