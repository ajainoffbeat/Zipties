import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/response/appError.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";
import { logger } from "../utils/logger.js";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error: AppError;

  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError(400, "File size exceeds the allowed limit", {
      success: false,
      code: RESPONSE_CODES.FILE_TOO_LARGE
    });
  } else if (err instanceof AppError) {
    error = err;
    } else {
    logger.error("Unhandled error", { error: err });
    error = new AppError(500, "Internal Server Error", {
      success: false,
      code: RESPONSE_CODES.INTERNAL_SERVER_ERROR
    });
  }

  res.status(200).json({
    success: error.success,
    code: error.code,
    message: error.message,
  });
};
