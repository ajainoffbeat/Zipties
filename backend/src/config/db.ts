import { Pool } from "pg";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const pool = new Pool({
  // connectionString: env.DATABASE_URL,
  connectionString: env.DATABASE_URL,
  // ssl:
  //   env.NODE_ENV === "production"
  //     // ? { rejectUnauthorized: false }
  //     // : false,
});

export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();

    client.release();
  } catch (error) {
    logger.error("Database connection failed", { error });
    process.exit(1);
  }
};

pool.on("connect", () => {
  logger.info("Database connected successfully");
});

pool.on("error", (err) => {
  logger.error("Unexpected database error", { error: err });
  process.exit(-1);
});