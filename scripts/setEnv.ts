import fs from "fs";
import path from "path";

//Get the current environment (defaults to "development" if not explicitly set)
const currentEnvironment = process.env.NODE_ENV || "development";

//Define the expected environment file path based on the environment
const environmentFilePath = path.resolve(__dirname, `../.env.${currentEnvironment}`);

//Check if the required .env file exists
if (!fs.existsSync(environmentFilePath)) {
  console.error(`🚨 Missing environment file: ${environmentFilePath}`);
  console.error("Please create the appropriate .env file before running the application.");
  process.exit(1); // Exit the process to prevent the app from running without the correct environment variables
} else {
  console.log(`✅ Using environment configuration from: ${environmentFilePath}`);
}
