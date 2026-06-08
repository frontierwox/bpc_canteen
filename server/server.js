import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './app.js';
import connectDB from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';

const PORT = process.env.PORT || 5000;

let server; // module-level reference — used for graceful shutdown

/**
 * Starts the API server:
 *   1. Connect to MongoDB
 *   2. Configure Cloudinary
 *   3. Listen on configured port
 */
const startServer = async () => {
  try {
    await connectDB();
    configureCloudinary();

    server = app.listen(PORT, () => {
      console.log(`\n🍽️  BPC Canteen API Server`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Port:        ${PORT}`);
      console.log(`   API:         http://localhost:${PORT}/api/v1`);
      console.log(`   Health:      http://localhost:${PORT}/api/v1/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
/**
 * Closes the HTTP server cleanly, then disconnects MongoDB.
 * A hard kill is forced after 10 seconds to prevent hanging.
 *
 * @param {string} signal - The OS signal received (SIGTERM / SIGINT)
 */
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);

  // Stop accepting new connections
  if (server) {
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed. Process exiting.');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err.message);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }

  // Force-exit if the server hasn't closed in 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
};

// ─── Process-level Error Handlers ─────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

startServer();
