/**
 * mongo.js
 *
 * Initializes the MongoDB connection using Mongoose.
 * Handles connection setup, logging, and error handling.
 *
 * Imported during server startup to ensure database availability.
 */


import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export async function connectMongo() {
  try {
    await mongoose.connect(env.mongoUri);
    logger.info("MongoDB connected:", env.mongoUri);
  } catch (err) {
    logger.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
