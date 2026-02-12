import type { Response, Request, NextFunction } from "express";
import { decodeToken, extractBearerToken } from "../utils/jwt.util.js";
import * as userService from "../services/user.service.js";
import { uploadToS3 } from "../services/s3.service.js";
import { AppError } from "../utils/response/appError.js";
import { sendSuccess } from "../utils/response/appSuccess.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";
import { getUsCities, updateUserProfile, userProfile } from "../services/user.service.js";


export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const { userId } = decodeToken(token);
    const rows = await userProfile(userId);
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
    const isUpdated = await updateUserProfile(
      userId,
      profileData
    );
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


export const getCities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query;
    const result = await getUsCities('US', "", q as string);
    sendSuccess(res, {
      data: result,
      status: 200,
      message: "cities fetched successfully",
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};


export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query;
    if (!q) {
      return sendSuccess(res, { data: [], status: 200, message: "Empty query", code: RESPONSE_CODES.SUCCESS });
    }

    const token = extractBearerToken(req.headers.authorization);
    const { userId: currentUserId } = decodeToken(token);

    const users = await userService.searchUsersByName(q as string, currentUserId);
    sendSuccess(res, {
      data: users,
      status: 200,
      message: "Users searched successfully",
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!(req as any).file) {
      throw new AppError(400, "No file uploaded");
    }

    const fileUrl = await uploadToS3((req as any).file);
    console.log(fileUrl);
    const token = extractBearerToken(req.headers.authorization);
    const { userId } = decodeToken(token);
    const isUpdated = await updateUserProfile(userId, { profile_image_url: fileUrl });
    console.log("isupdated ", isUpdated);
    if (!isUpdated) {
      throw new AppError(400, "Failed to update profile", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }
    sendSuccess(res, {
      data: { url: fileUrl },
      status: 200,
      message: "Avatar uploaded successfully to S3",
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfileById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const user = await userService.userProfile(userId as string);
    sendSuccess(res, {
      data: user,
      status: 200,
      message: "User fetched successfully",
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

