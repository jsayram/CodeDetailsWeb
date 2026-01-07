// Server-only file for database initialization
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { setEnv } from "../../scripts/setEnv";

// This file is exclusively for server components and API routes
// Using a singleton pattern for database connection management

// Server-side environment setup (only runs on server)
setEnv();

// Check for database URL
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

// Global symbol to ensure singleton instance across hot reloads
const globalSymbol = Symbol.for("CodeDetails.DatabaseClient");

interface GlobalWithSymbol {
  [globalSymbol]: DatabaseClient;
}

declare const global: GlobalWithSymbol;

class DatabaseClient {
  private client: ReturnType<typeof postgres>;
  private db: ReturnType<typeof drizzle>;
  private isShuttingDown: boolean = false;
  private shutdownHandler: () => Promise<void>;
  private static _instance: DatabaseClient | null = null;

  private constructor() {
    // Clean up any existing listeners from previous instances
    this.removeExistingListeners();

    // Create a PostgreSQL connection with proper connection pool configuration and retry logic
    const maxRetries = 3;
    const retryInterval = 2000; // 2 seconds

    const createConnection = (attempt = 1): ReturnType<typeof postgres> => {
      try {
        return postgres(process.env.DATABASE_URL!, {
          max: 5, // Reduced max connections
          idle_timeout: 20,
          connect_timeout: 10,
          max_lifetime: 60 * 30, // Max connection lifetime of 30 minutes
          connection: {
            application_name: 'CodeDetails',
          },
          transform: {
            undefined: null,
          },
          onnotice: (notice: { message?: string; severity?: string }) => {
            console.log('Database notice:', notice.message ?? notice);
          },
        });
      } catch (error) {
        if (attempt < maxRetries) {
          console.log(`Connection failed, retrying (attempt ${attempt + 1}/${maxRetries})...`);
          return createConnection(attempt + 1);
        }
        throw error;
      }
    };

    this.client = createConnection();
    this.db = drizzle(this.client, { schema });

    // Initialize shutdown handler
    this.shutdownHandler = async () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      console.log("🔄 Gracefully shutting down database connections...");

      try {
        await this.client.end();
        console.log("✅ Database connections closed successfully");
      } catch (error) {
        console.error("❌ Error closing database connections:", error);
      }

      // Don't call process.exit() as it might interfere with Next.js
      this.isShuttingDown = false;
    };

    // Set up shutdown handlers
    this.setupShutdownHandlers();
  }

  private removeExistingListeners() {
    // Get all listeners
    const sigTermListeners = process.listeners("SIGTERM");
    const sigIntListeners = process.listeners("SIGINT");
    const beforeExitListeners = process.listeners("beforeExit");

    // Remove any listeners that contain our shutdown message
    [...sigTermListeners, ...sigIntListeners, ...beforeExitListeners].forEach(
      (listener) => {
        if (
          listener
            .toString()
            .includes("Gracefully shutting down database connections")
        ) {
          process.removeListener("SIGTERM", listener);
          process.removeListener("SIGINT", listener);
          process.removeListener("beforeExit", listener);
        }
      }
    );
  }

  private setupShutdownHandlers() {
    process.on("SIGTERM", this.shutdownHandler);
    process.on("SIGINT", this.shutdownHandler);
    process.on("beforeExit", this.shutdownHandler);
  }

  public static getInstance(): DatabaseClient {
    if (process.env.NODE_ENV === "development") {
      // In development, use the global object to maintain the singleton
      if (!global[globalSymbol]) {
        global[globalSymbol] = new DatabaseClient();
      }
      return global[globalSymbol];
    } else {
      // In production, use regular singleton pattern
      if (!DatabaseClient._instance) {
        DatabaseClient._instance = new DatabaseClient();
      }
      return DatabaseClient._instance;
    }
  }

  public getClient() {
    return this.db;
  }

  public async cleanup() {
    this.removeExistingListeners();
    await this.shutdownHandler();
  }
}

// Export async functions that use the DB client internally
export async function executeQuery<T>(
  queryFn: (db: ReturnType<typeof drizzle>) => Promise<T>
): Promise<T> {
  try {
    const dbClient = DatabaseClient.getInstance().getClient();
    return await queryFn(dbClient);
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Re-export schema types for convenience - this is just TypeScript types, not actual values
export type Schema = typeof schema;

// Export DrizzleClient type for use in other files
export type DrizzleClient = ReturnType<typeof drizzle>;
