import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";

type LogErrorInput = {
  action: string;
  requestData: string;
  stackTrace?: string | null;
  errorMessage: string;
  createdBy?: string | null;
};

export const logErrorToDB = async ({
  action,
  requestData,
  stackTrace,
  errorMessage,
  createdBy,
}: LogErrorInput): Promise<void> => {
  try {
    await pool.query(
      `SELECT fn_log_error($1, $2, $3, $4, $5)`,
      [
        action,
        requestData.slice(0, 500),
        stackTrace || null,
        errorMessage.slice(0, 500),
        createdBy || null,
      ]
    );
  } catch (err) {
    logger.error("Error logging failed", { error: err });
  }
};
