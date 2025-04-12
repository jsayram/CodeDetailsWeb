// Server-only file for database initialization
// Note: We'll initialize the DB client but not use 'use server' directive here
// instead we'll use it in individual async functions

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { setEnv } from "../../scripts/setEnv";

// This file is exclusively for server components and API routes
// We'll initialize the database connection but only export async functions

// Server-side environment setup (only runs on server)
setEnv();

// Check for database URL
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

// Create a PostgreSQL connection - this is private to this module
const client = postgres(process.env.DATABASE_URL);

// Initialize the Drizzle ORM instance - this is private to this module
const db = drizzle(client, { schema });

// Export async functions that use the DB client internally
// This meets Next.js requirements for 'use server' files

/**
 * Execute a query with Drizzle
 * @param queryFn Function that uses the Drizzle query builder
 * @returns Result of the query
 */
export async function executeQuery<T>(
  queryFn: (db: ReturnType<typeof drizzle>) => Promise<T>
): Promise<T> {
  return await queryFn(db);
}

// Re-export schema types for convenience - this is just TypeScript types, not actual values
export type Schema = typeof schema;
