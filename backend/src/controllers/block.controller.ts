import type { Request, Response, NextFunction } from "express";
import * as blockService from "../services/block.service.js";
import type { BlockUserRequest } from "../@types/block.types.js";
import { decodeToken, extractBearerToken } from "../utils/jwt.util.js";
import { AppError } from "../utils/response/appError.js";
import { sendSuccess } from "../utils/response/appSuccess.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.constant.js";

/**
 * Block a user
 * POST /api/block/user
 */
export const blockUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user_blocked, is_blocking, comment } = req.body as BlockUserRequest;

    // Validate required fields
    if (!user_blocked) {
      throw new AppError(400, "user_blocked is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    // Extract and verify token
    const token = extractBearerToken(req.headers.authorization);
    const { userId } = decodeToken(token);

    // Use userId from token as user_blocking
    const user_blocking = userId;

    // Ensure the authenticated user is not trying to block themselves
    if (user_blocking === user_blocked) {
      throw new AppError(400, "Users cannot block themselves", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    // Call the service to block or unblock the user
    const blockResult = await blockService.blockUser(
      user_blocked, 
      user_blocking, 
      is_blocking !== false, // Default to true if not provided
      comment
    );

    const action = is_blocking === false ? "unblocked" : "blocked";
    
    sendSuccess(res, {
      status: RESPONSE_CODES.SUCCESS,
      message: `User ${action} successfully`,
      data: blockResult,
    });
  } catch (error) {
    next(error);
  }
};
