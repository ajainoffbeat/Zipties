import type { RateLimitResult } from "../@types/rateLimit.js";
import { pool } from "../config/db.js";

export const checkRateLimit = async (
  ipAddress: string | undefined,
  req_url: string,
  limit: number,
  windowSeconds: number,
  request_body: string,
  user_id: string | null
): Promise<boolean> => {
  const { rows } = await pool.query<RateLimitResult>(
    `SELECT check_rate_limit($1, $2, $3, $4, $5,$6) AS allowed`,
    [ipAddress, limit, windowSeconds, req_url, request_body,user_id]
  );

  return rows[0]?.allowed ?? false;
};
