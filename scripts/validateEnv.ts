import { loadEnv } from "./loadEnv";

// Load environment variables
loadEnv();

// validateEnvs.ts - Ensures all required environment variables are set before the app runs.
const requiredEnvVars = [
  // Secret keys (DO NOT expose)
  "SUPABASE_SERVICE_ROLE_KEY",  // Secret Supabase service role key (DO NOT expose)
  "CLERK_SECRET_KEY", // Secret API key for Clerk authentication (server-side)
  "STRIPE_SECRET_KEY", // Secret Stripe API key (server-side only)
  "DATABASE_URL", // Database connection string (PostgreSQL, MySQL, etc.)
  "JWT_SECRET", // Secret key used for JWT token encryption/authentication
  "ALGOLIA_ADMIN_KEY", // Secret Algolia Admin Key (server-side indexing)
  // Public keys 
  "NEXT_PUBLIC_SUPABASE_URL", // Public Supabase API URL 
  "NEXT_PUBLIC_SUPABASE_ANON_KEY", // Public Supabase anonymous key 
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", // Public API key for Clerk authentication
  "NEXT_PUBLIC_STRIPE_PUBLIC_KEY", // Public Stripe API key (frontend usage)
  "NEXT_PUBLIC_ALGOLIA_APP_ID", // Public Algolia App ID (search functionality)
  "NEXT_PUBLIC_ALGOLIA_SEARCH_KEY", // Public Algolia Search Key (used in frontend search)
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