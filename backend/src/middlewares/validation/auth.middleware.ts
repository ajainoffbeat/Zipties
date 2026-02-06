import type { NextFunction,Request, Response } from "express";
import { loginSchema, signupSchema } from "../../services/validations/auth.validation.js";
import { AppError } from "../../utils/response/appError.js";
import { RESPONSE_CODES } from "../../constants/responseCode.constant.js";
import { RESPONSE_MESSAGES } from "../../constants/responseMessages.constant.js";

export const validateLoginMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    const errorMessage = parsed.error.issues
      .map(issue => issue.message)
      .join(", ");
 
      throw new AppError(
        400,
        errorMessage,
        {
        code: RESPONSE_CODES.BAD_REQUEST,
        success:false
        }
      )}


 
  next();
};


export const validateSignupMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    const errorMessage = parsed.error.issues
      .map(issue => issue.message)
      .join(", ");

    throw new AppError(
      400,
      errorMessage, 
      {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      }
    );
  }

  next();
};
