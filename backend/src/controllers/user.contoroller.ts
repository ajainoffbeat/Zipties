import type { Response, Request, NextFunction } from "express";
import { decodeToken, extractBearerToken } from "../utils/jwt.util.js";
import { getUsCities, updateUserProfile, userProfile, searchUsersByName, blockUser as blockUserService, followUser as followUserService, unfollowUser as unfollowUserService, getFollowerCount, getFollowCountsController } from "../services/user.service.js";
import { deleteFromS3, uploadToS3 } from "../services/s3.service.js";
import { AppError } from "../utils/response/appError.js";
import { sendSuccess } from "../utils/response/appSuccess.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";
import type { BlockUserRequest } from "../@types/block.types.js";

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

    const users = await searchUsersByName(q as string, currentUserId);
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
    const fileUrl = await uploadToS3((req as any).file,'avatars');
    const token = extractBearerToken(req.headers.authorization);
    const { userId } = decodeToken(token);

    const user = await userProfile(userId, userId);
    if (user?.profile_image_url) {
      await deleteFromS3(user.profile_image_url);
    }
    const isUpdated = await updateUserProfile(userId, { profile_image_url: fileUrl });
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
    const token = extractBearerToken(req.headers.authorization);
    const { userId: currentUserId } = decodeToken(token);
    const user = await userProfile(currentUserId,userId as string);
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
    const blockResult = await blockUserService(
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

export const followUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId: followingId } = req.params;
    
    // Validate required fields
    if (!followingId) {
      throw new AppError(400, "User ID to follow is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    // Extract and verify token
    const token = extractBearerToken(req.headers.authorization);
    const { userId: followerId } = decodeToken(token);

    // Ensure the authenticated user is not trying to follow themselves
    if (followerId === followingId) {
      throw new AppError(400, "Users cannot follow themselves", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    // Call the service to follow the user
    const followResult = await followUserService(followerId, followingId);

    sendSuccess(res, {
      status: RESPONSE_CODES.SUCCESS,
      message: "User followed successfully",
      data: followResult,
    });
  } catch (error) {
    next(error);
  }
};

export const unfollowUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId: followingId } = req.params;
    
    // Validate required fields
    if (!followingId) {
      throw new AppError(400, "User ID to unfollow is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    // Extract and verify token
    const token = extractBearerToken(req.headers.authorization);
    const { userId: followerId } = decodeToken(token);

    // Ensure the authenticated user is not trying to unfollow themselves
    if (followerId === followingId) {
      throw new AppError(400, "Users cannot unfollow themselves", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    // Call the service to unfollow the user
    await unfollowUserService(followerId, followingId);

    sendSuccess(res, {
      status: RESPONSE_CODES.SUCCESS,
      message: "User unfollowed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowerCountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    
    // Validate required fields
    if (!userId) {
      throw new AppError(400, "User ID is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    // Get follower count
    const count = await getFollowerCount(userId);

    sendSuccess(res, {
      status: RESPONSE_CODES.SUCCESS,
      message: "Follower count retrieved successfully",
      data: { followers_count: count },
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowingCountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    
    // Validate required fields
    if (!userId) {
      throw new AppError(400, "User ID is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    // Get following count
    const count = await getFollowerCountController(userId, res, next);

    sendSuccess(res, {
      status: RESPONSE_CODES.SUCCESS,
      message: "Following count retrieved successfully",
      data: { following_count: count },
    });
  } catch (error) {
    next(error);
  }
};

export const getFollowCounts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    console.log("userId", userId);
    // Validate required fields
    if (!userId) {
      throw new AppError(400, "User ID is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    // Get both counts
    const counts = await getFollowCountsController(userId);

    sendSuccess(res, {
      status: RESPONSE_CODES.SUCCESS,
      message: "Follow counts retrieved successfully",
      data: counts,
    });
  } catch (error) {
    next(error);
  }
};