"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { isValidTier, getAccessibleTiers } from "@/services/tierServiceServer";
import { useUserTier } from "@/hooks/use-tierServiceClient";
import { getAnonymousClient } from "@/services/supabase";
import Link from "next/link";
import { LockIcon, ArrowUpCircle, HomeIcon } from "lucide-react";
import { GenericLoadingState } from "@/components/LoadingState/GenericLoadingState";
import { ProjectListLoadingState } from "@/components/LoadingState/ProjectListLoadingState";

/**
 * A component that protects content based on authentication status, user roles, or subscription tiers.
 *
 * Usage examples:
 *
 * 1. Basic authentication protection (requires sign-in only):
 *    <ProtectedPage>
 *      <UserDashboard />
 *    </ProtectedPage>
 *
 * 2. Tier-based protection (requires specific subscription):
 *    <ProtectedPage allowedTiers={["pro", "diamond"]}>
 *      <PremiumFeatures />
 *    </ProtectedPage>
 *
 * 3. Free tier content (explicitly allows free tier):
 *    <ProtectedPage allowedTiers={["free", "pro", "diamond"]}>
 *      <BasicFeatures />
 *    </ProtectedPage>
 *
 * 4. Role-based protection (for future use):
 *    <ProtectedPage allowedRoles={["admin", "moderator"]}>
 *      <AdminPanel />
 *    </ProtectedPage>
 *
 * 5. Combined protection (requires both specific role and tier):
 *    <ProtectedPage allowedRoles={["admin"]} allowedTiers={["diamond"]}>
 *      <SuperAdminFeatures />
 *    </ProtectedPage>
 */
type ProtectedPageProps = {
  allowedRoles?: string[]; // e.g. ["admin", "moderator"]
  allowedTiers?: string[]; // e.g. ["pro", "diamond"]
  children: React.ReactNode;
};

export default function ProtectedPage({
  allowedTiers,
  children,
}: ProtectedPageProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(true);
  const [requiredTier, setRequiredTier] = useState<string | null>(null);

  // Use useMemo for the Supabase client to prevent recreation on each render
  const supabaseClient = useMemo(() => getAnonymousClient(), []);

  // Use the tierService hook directly
  const { userTier, loading: loadingTier } = useUserTier(
    supabaseClient,
    user?.id || null
  );

  // Calculate the lowest required tier once when allowedTiers changes
  const lowestRequiredTier = useMemo(() => {
    if (!allowedTiers?.length) return null;

    const tierHierarchy = ["free", "pro", "diamond"];
    const validAllowedTiers = allowedTiers.filter((tier) => isValidTier(tier));

    return validAllowedTiers.reduce((lowest, current) => {
      const lowestIndex = tierHierarchy.indexOf(lowest);
      const currentIndex = tierHierarchy.indexOf(current);
      return currentIndex < lowestIndex && currentIndex !== -1
        ? current
        : lowest;
    }, validAllowedTiers[0]);
  }, [allowedTiers]);

  // Check access once we have all required information
  const checkAccess = useCallback(() => {
    // No tier restrictions = access granted
    if (!allowedTiers?.length) {
      setHasAccess(true);
      return;
    }

    // Get accessible tiers for the current user
    const accessibleTiers = getAccessibleTiers(userTier);

    // Check if any of the allowed tiers are accessible to the user
    const accessGranted = allowedTiers.some((tier) =>
      accessibleTiers.includes(tier)
    );

    setHasAccess(accessGranted);
    setRequiredTier(lowestRequiredTier);
  }, [allowedTiers, userTier, lowestRequiredTier]);

  // Handle authentication and access checks
  useEffect(() => {
    // Only proceed when auth is loaded
    if (!isLoaded) return;

    // If user is not signed in, redirect to sign-in page
    if (!isSignedIn) {
      router.replace("/auth/sign-in");
      return;
    }

    // Once we have the user tier, check access
    if (userTier) {
      checkAccess();
    }
  }, [isLoaded, isSignedIn, router, userTier, checkAccess]);

  // Show loading state
  if (!isLoaded || loadingTier) {
    return (
      <div className="p-4 max-w-screen-xl mx-auto">
        <ProjectListLoadingState />
      </div>
    );
  }

  // If user has access, show the protected content
  if (hasAccess) {
    return <>{children}</>;
  }

  // Otherwise, show paywall with blurred content in the background
  return (
    <div className="relative flex items-center justify-center">
      {/* Blurred content in the background */}
      <div className="filter blur-sm opacity-30 pointer-events-none ">
        {!isLoaded || loadingTier ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <GenericLoadingState className="w-full max-w-md mx-auto" />
          </div>
        ) : (
          children
        )}
      </div>

      {/* Paywall overlay */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="min-h-[350px] bg-white/95 dark:bg-gray-900/95 p-5 sm:p-6 md:p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all hover:scale-105 hover:rotate-3">
            <LockIcon className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 dark:text-amber-400" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300">
            Premium Content
          </h2>

          <p className="mb-6 text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-xs mx-auto">
            Oops! Looks like you are currently on the{" "}
            <span className="font-semibold capitalize">{userTier}</span> plan.
            Please upgrade to{" "}
            <span className="font-semibold capitalize bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {requiredTier}
            </span>{" "}
            to view this content.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center sm:gap-4">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Upgrade Now
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm sm:text-base"
            >
              <HomeIcon className="w-4 h-4" />
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
