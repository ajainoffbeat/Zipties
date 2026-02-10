import type { RateLimitResult } from "../@types/rateLimit.js";
import { pool } from "../config/db.js";

export const checkRateLimit = async (
  ipAddress: string |undefined,
  req_url:string,
  limit: number,
  windowSeconds: number,
  request_body:string
): Promise<boolean> => {
  const { rows } = await pool.query<RateLimitResult>(
    `SELECT fn_check_rate_limit($1, $2, $3, $4, $5) AS allowed`,
    [ipAddress, limit, windowSeconds,req_url,request_body]
  );

  return rows[0]?.allowed ?? false;
};
