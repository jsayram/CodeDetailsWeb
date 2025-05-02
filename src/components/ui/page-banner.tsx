"use client";

import { LucideIcon } from "lucide-react";
import React from "react";
import Image from "next/image";
import { SignIn, SignInButton, useUser } from "@clerk/nextjs";
import { SignInButtonComponent } from "../auth/SignInButtonComponent";

interface PageBannerProps {
  icon?: React.ReactNode; // Made icon optional
  userName?: string; // Made optional since community banners won't have a user
  bannerTitle: string;
  description?: string; // Added description prop
  userTier?: string; // Made optional for community banners
  gradientFrom: string;
  gradientVia?: string;
  gradientTo?: string;
  borderColor?: string;
  tierBgColor?: string; // Made optional since it's only needed for user tiers
  textGradient: string;
  isUserBanner?: boolean; // New prop to determine if it's a user banner
  logo?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }; // New prop for optional logo
}

export function PageBanner({
  icon,
  userName,
  bannerTitle,
  description,
  userTier,
  gradientFrom,
  gradientVia,
  gradientTo,
  borderColor,
  tierBgColor,
  textGradient,
  isUserBanner = true, // Default to user banner for backward compatibility
  logo,
}: PageBannerProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div
        className={`flex flex-col md:flex-row items-center gap-4 bg-gradient-to-r from-${gradientFrom} ${
          gradientVia ? `via-${gradientVia}` : ""
        } to-${gradientTo} rounded-2xl shadow-lg px-6 py-4 w-full border ${borderColor}`}
      >
        <div className="flex items-center gap-4">
          {icon && icon} {/* Only render icon if it exists */}
          {logo && (
            <div className="relative w-10 h-10">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className="object-contain"
              />
            </div>
          )}
        </div>
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-foreground dark:text-foreground drop-shadow-lg flex flex-col md:flex-row items-center gap-2">
            {isUserBanner ? (
              <>
                {userName}&apos;s{" "}
                <span
                  className={`bg-gradient-to-r ${textGradient} bg-clip-text text-transparent animate-gradient-x`}
                >
                  {bannerTitle}
                </span>
              </>
            ) : (
              <span
                className={`bg-gradient-to-r ${textGradient} bg-clip-text text-transparent animate-gradient-x`}
              >
                {bannerTitle}
              </span>
            )}
          </h2>
          {description && (
            <p className="text-sm text-foreground mt-2">
              {description}
            </p>
          )}
        </div>
        {isUserBanner && userTier && tierBgColor && (
          <div className="ml-0 md:ml-auto mt-2 md:mt-0 w-full md:w-auto flex justify-center md:block">
            <span
              className={`inline-block px-4 py-2 rounded-xl ${tierBgColor} text-indigo-100 font-mono text-xs tracking-widest shadow`}
            >
              {userTier} member
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
