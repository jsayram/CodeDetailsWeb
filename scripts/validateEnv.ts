import { setEnv } from "./setEnv";

// load and set environment variables
setEnv();

// validateEnvs.ts - Ensures all required environment variables are set before the app runs.
// MVP Environment Variables Only
const requiredEnvVars = [
  // MVP: Secret keys (DO NOT expose)
  "SUPABASE_SERVICE_ROLE_KEY",  // Secret Supabase service role key (DO NOT expose)
  "CLERK_SECRET_KEY", // Secret API key for Clerk authentication (server-side)
  "CLERK_WEBHOOK_SIGNING_SECRET", // Secret for verifying Clerk webhooks
  "DATABASE_URL", // Database connection string (PostgreSQL)
  
  // MVP: Public keys 
  "NEXT_PUBLIC_SUPABASE_URL", // Public Supabase API URL 
  "NEXT_PUBLIC_SUPABASE_ANON_KEY", // Public Supabase anonymous key 
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", // Public API key for Clerk authentication
  
  // MVP: Clerk Auth Routes
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL", // Sign-in route
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL", // Sign-up route
  "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL", // Fallback URL after sign-in
  "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL", // Fallback URL after sign-up
];

// ❌ Future Features (Not MVP) - Uncomment when needed
const futureEnvVars = [
  // "STRIPE_SECRET_KEY", // Payments - not MVP
  // "NEXT_PUBLIC_STRIPE_PUBLIC_KEY", // Payments - not MVP
  // "JWT_SECRET", // Custom JWT - not needed (using Clerk)
  // "ALGOLIA_ADMIN_KEY", // Search - not MVP
  // "NEXT_PUBLIC_ALGOLIA_APP_ID", // Search - not MVP
  // "NEXT_PUBLIC_ALGOLIA_SEARCH_KEY", // Search - not MVP
];

//Check which required environment variables are missing.
const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

//If any required variables are missing, log an error and stop the process.
if (missingVars.length > 0) {
  console.error(`🚨 Missing required environment variables: ${missingVars.join(", ")} \n ❌ Exiting program ❌`);
  process.exit(1); // Exit the process to prevent the app from running without essential config.
} else {
  console.log("✅ All required environment variables are set"); // Success message
}