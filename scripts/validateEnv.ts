//validateEnvs.ts - Ensures all required environment variables are set before the app runs.
const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",      // Public Supabase API URL (safe to expose)
    "SUPABASE_SERVICE_ROLE_KEY",     // Secret Supabase service role key (DO NOT expose)
    "NEXT_PUBLIC_ALGOLIA_APP_ID",     // Public Algolia App ID (search functionality)
    "NEXT_PUBLIC_ALGOLIA_SEARCH_KEY", // Public Algolia Search Key (used in frontend search)
    "ALGOLIA_ADMIN_KEY",              // Secret Algolia Admin Key (server-side indexing)
  ];
  
  //Check which required environment variables are missing.
  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  
  //If any required variables are missing, log an error and stop the process.
  if (missingVars.length > 0) {
    console.error(`🚨 Missing required environment variables: ${missingVars.join(", ")}`);
    process.exit(1); // Exit the process to prevent the app from running without essential config.
  } else {
    console.log("✅ All required environment variables are set."); // Success message
  }
  