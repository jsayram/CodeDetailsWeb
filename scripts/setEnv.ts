import fs from "fs";
import path from "path";

//Get the current environment (defaults to "development" if not explicitly set)
const currentEnvironment = process.env.NODE_ENV || "development";

// Define possible `.env` file paths
const envFiles = [
  ...(currentEnvironment !== "test" ? [path.resolve(__dirname, "../.env.local")] : []), // Load `.env.local` only if NOT in test mode (to avoid conflicts with Jest) 
  path.resolve(__dirname, `../.env.${currentEnvironment}`), // Environment-specific file
];

// Find the first existing `.env` file
const foundEnvFile = envFiles.find(fs.existsSync);

if (!foundEnvFile) {
  console.error(`🚨 Missing environment file: No valid .env file found for ${currentEnvironment}`);
  process.exit(1);
} else {
  console.log(`✅ Using environment configuration from: ${foundEnvFile}`);
}
