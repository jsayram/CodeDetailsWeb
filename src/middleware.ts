import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
        "/",  // Allow access to the root page
        "/sign-in(.*)", 
        "/sign-up(.*)",
        "/shared-projects/(.*)",  // Added (.*) to handle any trailing segments
        "/projects/:slug",
        "/projects/users/:username(.*)",  // Added (.*) to handle any trailing segments
        "/api/shared-projects/(.*)",  // Added (.*) to handle any trailing segments
        "/api/webhook/clerk", // Allow Clerk webhook endpoint
        "/api/auth/sync-user", // Allow sync endpoint (prevent auth loop)
]);

const isAdminRoute = createRouteMatcher([
  "/dashboard/admin(.*)",
  "/api/projects/test(.*)",
  "/api/darkmodetest(.*)",
  "/api/toasttest(.*)",
]);

// Simple in-memory cache for admin checks (expires after 5 minutes)
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Sync deduplication cache - prevents redundant user sync calls
const syncCache = new Map<string, number>(); // userId -> last sync timestamp
const SYNC_DEBOUNCE_TIME = 5 * 60 * 1000; // 5 minutes - don't sync same user more than once per 5 minutes

function isAdminCached(userId: string, userEmail: string | undefined): boolean {
  const cached = adminCache.get(userId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.isAdmin;
  }
  
  const adminEmail = process.env.ADMIN_DASHBOARD_MODERATOR;
  const isAdmin = !!(adminEmail && userEmail?.toLowerCase().trim() === adminEmail.toLowerCase().trim());
  
  adminCache.set(userId, { isAdmin, timestamp: now });
  return isAdmin;
}

function shouldSyncUser(userId: string): boolean {
  const lastSync = syncCache.get(userId);
  const now = Date.now();
  
  if (lastSync && (now - lastSync) < SYNC_DEBOUNCE_TIME) {
    return false; // Recently synced, skip
  }
  
  syncCache.set(userId, now);
  return true;
}

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Check admin routes first
  if (isAdminRoute(req)) {
    if (!userId) {
      // Not signed in, redirect to sign-in
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    try {
      // Get user's email from Clerk with error handling
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const userEmail = user.emailAddresses[0]?.emailAddress;

      // Check if user is admin using cache
      if (!isAdminCached(userId, userEmail)) {
        // Not admin, redirect to regular dashboard or home
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      // Admin verified, continue to admin route
    } catch (error) {
      // If Clerk API fails (rate limit or other error), check cache
      const cached = adminCache.get(userId);
      if (cached && cached.isAdmin) {
        // Use cached admin status if available
        console.warn('Using cached admin status due to Clerk API error');
      } else {
        // If no cache and API fails, redirect to dashboard for safety
        console.error('Clerk API error in middleware:', error);
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  // Only trigger sync for actual page navigation requests
  // Skip API routes, Server Actions, data requests, and other internal Next.js paths
  const pathname = req.nextUrl.pathname;
  const shouldSkipSync = 
    pathname.startsWith('/api') ||           // API routes
    pathname.startsWith('/_next/') ||        // Next.js internals (includes Server Actions)
    pathname.includes('__nextDataReq') ||    // Data requests
    pathname.startsWith('/_vercel/') ||      // Vercel internals
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|json|woff|woff2|ttf|eot)$/); // Static files
  
  // Only sync if:
  // 1. User is authenticated
  // 2. Not a skipped path type
  // 3. User hasn't been synced recently (deduplication)
  if (userId && !shouldSkipSync && shouldSyncUser(userId)) {
    fetch(`${req.nextUrl.origin}/api/auth/sync-user`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    }).catch(() => {
      // Silently fail - sync will happen on next request
    });
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
