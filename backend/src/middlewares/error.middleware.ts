import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/response/appError.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else {
    console.log(err);
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
