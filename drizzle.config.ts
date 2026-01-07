import { defineConfig } from "drizzle-kit";
import { setEnv } from "./scripts/setEnv";

// Load environment variables using the setEnv utility
setEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./src/db/migrations/supabase/",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Add introspection configuration
  introspect: {
    casing: "camel", // Convert snake_case table names to camelCase in TypeScript
  },
});
