const path = require("path");
const dotenv = require("dotenv");

const dotenvPath = path.resolve(__dirname, "../.env");

if (!process.env.ENV_LOADED) {
  const result = dotenv.config({ path: dotenvPath });

  if (result.error) {
    console.error("Failed to load .env file:", result.error);
    process.exit(1);
  } else {
    console.log("Loaded .env file");
  }

  process.env.ENV_LOADED = "true";
}
