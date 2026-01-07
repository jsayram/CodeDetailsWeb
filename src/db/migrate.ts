// This file should only be executed in a Node.js environment, not in the browser
// It's used by the 'db:migrate' npm script, not by the Next.js application directly

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { setEnv } from "../../scripts/setEnv";

// Load environment variables using the project's existing system
setEnv();

// This will run migrations on the database, creating tables if they don't exist
// and updating them if they do, based on the content in the 'migrations' folder
const runMigration = async () => {
  console.log("Starting migration process...");
  
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL environment variable");
    throw new Error("DATABASE_URL environment variable is not defined");
  }

  console.log("Database URL found, connecting to database...");

  // Connect directly to PostgreSQL for migrations
  const connection = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(connection);

  console.log("⏳ Running migrations...");

  try {
    await migrate(db, {
      migrationsFolder: "./src/db/migrations/supabase", // Fixed path to the migrations folder
      migrationsTable: "drizzle_migrations", // Track applied migrations in this table
    });
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  await connection.end();
  console.log("Database connection closed.");
  process.exit(0);
};

console.log("Migration script started");
runMigration().catch((err) => {
  console.error("❌ Migration script error:", err);
  process.exit(1);
});
