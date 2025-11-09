import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

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
