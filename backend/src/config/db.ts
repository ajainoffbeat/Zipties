import { Pool } from "pg";
import { env } from "./env.js";

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
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

pool.on("connect", () => {
  console.log("Database connected successfully");
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
  process.exit(-1);
});