import dotenv from 'dotenv';
dotenv.config();

import app from '../app.js';
import connectDB from '../config/db.js';
import { configureCloudinary } from '../config/cloudinary.js';

/**
 * Vercel Serverless Entry Point
 *
 * Vercel imports the default export (Express app) and wraps it
 * as a serverless function. No `app.listen()` is needed here.
 *
 * DB connection and Cloudinary are initialized once per cold start,
 * then reused across warm invocations via the module-level promise.
 */

// Initialize services once per cold start
const initPromise = (async () => {
  try {
    await connectDB();
    configureCloudinary();
  } catch (error) {
    console.error('❌ Serverless initialization failed:', error.message);
  }
})();

// Wrap the Express app to ensure initialization completes before handling requests
const handler = async (req, res) => {
  await initPromise;
  return app(req, res);
};

export default handler;
