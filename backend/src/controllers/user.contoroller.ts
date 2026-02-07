import type { Response, Request, NextFunction } from "express";
import { decodeToken, extractBearerToken } from "../utils/jwt.util.js";
import { userProfile, updateUserProfile } from "../services/user.service.js";
import { AppError } from "../utils/response/appError.js";   
import { sendSuccess } from "../utils/response/appSuccess.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";


export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId }:any = req.params;
    console.log("userId", userId);

    const rows = await userProfile(userId);
    console.log("rows", rows);
    if (!rows) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

export const editProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const decoded = decodeToken(token);
    const userId = decoded.userId;
    
    const profileData = req.body;

    console.log("userId", userId);
    console.log("profileData", profileData);

    const isUpdated = await updateUserProfile(userId, profileData);

    if (!isUpdated) {
      throw new AppError(400, "Failed to update profile", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    sendSuccess(res, {
      status: 200,
      message: "Profile updated successfully",
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};