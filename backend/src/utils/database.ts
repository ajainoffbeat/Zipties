import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";

export const executeQuery = async <T = any>(
  query: string,
  params?: any[]
) => {
  try {
    return await pool.query(query, params);
  } catch (error) {
    logger.error('Database query error', { query, params, error });
    throw error;
  }
};

export const executeStoredProcedure = async <T = any>(
  functionName: string,
  params: any[] = []
): Promise<T | null> => {
  const placeholders = params.map((_, index) => `$${index + 1}`).join(', ');
  const query = `SELECT * FROM ${functionName}(${placeholders})`;
  
  try {
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  } catch (error) {
    logger.error(`Stored procedure ${functionName} error`, { params, error });
    throw error;
  }
};
