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

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Check admin routes first
  if (isAdminRoute(req)) {
    if (!userId) {
      // Not signed in, redirect to sign-in
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // Get user's email from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;
    const adminEmail = process.env.ADMIN_DASHBOARD_MODERATOR;

    // Check if user is admin
    if (!adminEmail || userEmail?.toLowerCase().trim() !== adminEmail.toLowerCase().trim()) {
      // Not admin, redirect to regular dashboard or home
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // Admin verified, continue to admin route
  }

  // Only trigger sync for page requests, not API routes
  // This prevents duplicate syncs on every API call
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  
  if (userId && !isApiRoute) {
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
