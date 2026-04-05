require('dotenv').config();

const { createEnv, string, number } = require('@navnathgunjal/envcheck');

/**
 * Validate and export all required environment variables.
 * The app will refuse to start with a clear error if any are missing or invalid.
 */
const env = createEnv({
  PORT: number(),
  JWT_SECRET: string(),
  GEMINI_API_KEY: string(),
  DATABASE_URL: string(),
});

module.exports = env;
