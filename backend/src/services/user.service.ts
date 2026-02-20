import type { BlockUserResponse } from "../@types/block.types.js";
import type {
  UserProfileData,
  UserProfile,
  City,
  UserSearchResult,
} from "../@types/user.types.js";
import { AppError } from "../utils/response/appError.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";
import { logger } from "../utils/logger.js";
import { pool } from "../config/db.js";

export const userProfile = async (
  currentUserId: string,
  userId: string,
): Promise<UserProfile | null> => {
  try {
    const result = await pool.query(
      `SELECT * FROM fn_get_user_profile($1, $2)`,
      [currentUserId, userId],
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error(
      "Failed to fetch user profile",
      { currentUserId, userId, error },
      currentUserId,
    );
    throw error;
  }
};

export const updateUserProfile = async (
  userId: string,
  profileData: UserProfileData,
): Promise<boolean> => {
  try {
    const result = await pool.query(
      `SELECT fn_update_user(
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
  ) AS success`,
      [
        userId,
        profileData.first_name ?? null,
        profileData.last_name ?? null,
        profileData.username ?? null,
        profileData.bio ?? null,
        profileData.profile_image_url ?? null,
        userId,
        profileData.city_id?.trim() || null,
        profileData.interests ?? null,
        profileData.tags ?? null,
      ],
    );

    logger.info("User profile updated successfully", { userId }, userId);
    return result.rows[0]?.success === true;
  } catch (err) {
    logger.error(
      "Error updating user profile",
      { userId, profileData, error: err },
      userId,
    );
    return false;
  }
};

export const getUsCities = async (
  countryCode: string,
  search?: string,
  state?: string,
  limit = 50,
  offset = 0,
): Promise<City[]> => {
  try {
    const result = await pool.query(
      `SELECT * FROM fn_get_cities($1, $2, $3, $4, $5)`,
      [countryCode, state || null, search || null, limit, offset],
    );

    logger.debug("Cities fetched successfully", {
      countryCode,
      search,
      state,
      limit,
      offset,
      count: result.rows.length,
    });
    return result.rows || [];
  } catch (err) {
    logger.error("Error fetching cities", {
      countryCode,
      search,
      state,
      limit,
      offset,
      error: err,
    });
    throw err;
  }
};

export const searchUsersByName = async (
  query: string,
  currentUserId: string,
): Promise<UserSearchResult[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const result = await pool.query(
      `SELECT * FROM fn_search_users_by_name($1, $2)`,
      [query, currentUserId],
    );

    logger.debug(
      "User search completed",
      { query, currentUserId, count: result.rows.length },
      currentUserId,
    );
    return result.rows || [];
  } catch (error) {
    logger.error(
      "Error searching users by name",
      { query, currentUserId, error },
      currentUserId,
    );
    throw error;
  }
};

/**
 * Block or unblock a user by calling the appropriate stored procedure
 * @param userBlocked - UUID of the user being blocked/unblocked
 * @param userBlocking - UUID of the user performing the action
 * @param isBlocking - true to block, false to unblock
 * @param comment - Optional comment for blocking (only used when isBlocking is true)
 * @returns Block relationship data
 * @throws Error if validation fails or database error occurs
 */
export const blockUser = async (
  userBlocked: string,
  userBlocking: string,
  isBlocking: boolean = true,
  comment?: string,
): Promise<BlockUserResponse> => {
  // Validate inputs
  if (!userBlocked || !userBlocking) {
    throw new AppError(400, "Both user IDs are required", {
      code: RESPONSE_CODES.BAD_REQUEST,
      success: false,
    });
  }

  if (userBlocked === userBlocking) {
    throw new AppError(400, "Users cannot block themselves", {
      code: RESPONSE_CODES.BAD_REQUEST,
      success: false,
    });
  }

  try {
    logger.info("isBlocking", isBlocking);
    // Choose the appropriate stored procedure based on isBlocking parameter
    if (isBlocking) {
      // Block operation: fn_block_user(p_user_id, p_blocked_user_id, p_comment)
      const result = await pool.query(
        "SELECT * FROM fn_block_user($1, $2, $3)",
        [userBlocking, userBlocked, comment || null],
      );

      // Check if the operation was successful
      if (!result.rows[0]?.success) {
        const message = result.rows[0]?.message || "Block operation failed";

        // Handle specific error cases
        if (message.includes("already blocked")) {
          throw new AppError(409, message, {
            code: RESPONSE_CODES.USER_ALREADY_EXISTS,
            success: false,
          });
        }

        if (message.includes("do not exist") || message.includes("required")) {
          throw new AppError(400, message, {
            code: RESPONSE_CODES.BAD_REQUEST,
            success: false,
          });
        }

        // General operation failure
        throw new AppError(400, message, {
          code: RESPONSE_CODES.BAD_REQUEST,
          success: false,
        });
      }

      // For block operations, return the block relationship data
      return {
        block_id: result.rows[0]?.block_id || null,
        blocked_at: result.rows[0]?.blocked_at || new Date().toISOString(),
      };
    } else {
      // Unblock operation: fn_unblock_user(p_user_id, p_blocked_user_id)
      const result = await pool.query("SELECT * FROM fn_unblock_user($1, $2)", [
        userBlocking,
        userBlocked,
      ]);

      // Check if the operation was successful
      if (!result.rows[0]?.success) {
        const message = result.rows[0]?.message || "Unblock operation failed";

        // Handle specific error cases
        if (message.includes("not found")) {
          throw new AppError(404, message, {
            code: RESPONSE_CODES.USER_NOT_FOUND,
            success: false,
          });
        }

        if (
          message.includes("required") ||
          message.includes("Invalid operation")
        ) {
          throw new AppError(400, message, {
            code: RESPONSE_CODES.BAD_REQUEST,
            success: false,
          });
        }

        // General operation failure
        throw new AppError(400, message, {
          code: RESPONSE_CODES.BAD_REQUEST,
          success: false,
        });
      }

      // For unblock operations, we don't have block_id/blocked_at, so return appropriate response
      return {
        block_id: null,
        blocked_at: new Date().toISOString(),
      };
    }
  } catch (error: any) {
    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // Handle database connection errors
    if (error.code === "ECONNREFUSED" || error.code === "3D000") {
      throw new AppError(503, "Database service unavailable", {
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        success: false,
      });
    }

    // Re-throw the error for the controller to handle
    throw error;
  }
};

/**
 * Follow a user by calling the stored procedure
 * @param followerId - UUID of the user who wants to follow
 * @param followingId - UUID of the user to be followed
 * @returns Follow relationship data
 * @throws Error if validation fails or database error occurs
 */
export const followUser = async (
  followerId: string,
  followingId: string,
): Promise<{ follow_id: string; followed_at: string }> => {
  // Validate inputs
  if (!followerId || !followingId) {
    throw new AppError(400, "Both user IDs are required", {
      code: RESPONSE_CODES.BAD_REQUEST,
      success: false,
    });
  }

  if (followerId === followingId) {
    throw new AppError(400, "Users cannot follow themselves", {
      code: RESPONSE_CODES.BAD_REQUEST,
      success: false,
    });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM fn_follow_user($1, $2)",
      [followerId, followingId],
    );

    // Check if the operation was successful
    if (!result.rows[0]?.success) {
      const message = result.rows[0]?.message || "Follow operation failed";

      // Handle specific error cases
      if (message.includes("already following")) {
        throw new AppError(409, message, {
          code: RESPONSE_CODES.USER_ALREADY_EXISTS,
          success: false,
        });
      }

      if (message.includes("not found") || message.includes("required")) {
        throw new AppError(400, message, {
          code: RESPONSE_CODES.BAD_REQUEST,
          success: false,
        });
      }

      // General operation failure
      throw new AppError(400, message, {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    return {
      follow_id: result.rows[0]?.follow_id || "",
      followed_at: result.rows[0]?.followed_at || new Date().toISOString(),
    };
  } catch (error: any) {
    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // Handle database connection errors
    if (error.code === "ECONNREFUSED" || error.code === "3D000") {
      throw new AppError(503, "Database service unavailable", {
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        success: false,
      });
    }

    // Re-throw the error for the controller to handle
    throw error;
  }
};

/**
 * Unfollow a user by calling the stored procedure
 * @param followerId - UUID of the user who wants to unfollow
 * @param followingId - UUID of the user to be unfollowed
 * @throws Error if validation fails or database error occurs
 */
export const unfollowUser = async (
  followerId: string,
  followingId: string,
): Promise<void> => {
  // Validate inputs
  if (!followerId || !followingId) {
    throw new AppError(400, "Both user IDs are required", {
      code: RESPONSE_CODES.BAD_REQUEST,
      success: false,
    });
  }

  if (followerId === followingId) {
    throw new AppError(400, "Users cannot unfollow themselves", {
      code: RESPONSE_CODES.BAD_REQUEST,
      success: false,
    });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM fn_unfollow_user($1, $2)",
      [followerId, followingId],
    );

    // Check if the operation was successful
    if (!result.rows[0]?.success) {
      const message = result.rows[0]?.message || "Unfollow operation failed";

      // Handle specific error cases
      if (message.includes("not following")) {
        throw new AppError(404, message, {
          code: RESPONSE_CODES.USER_NOT_FOUND,
          success: false,
        });
      }

      if (message.includes("required") || message.includes("cannot")) {
        throw new AppError(400, message, {
          code: RESPONSE_CODES.BAD_REQUEST,
          success: false,
        });
      }

      // General operation failure
      throw new AppError(400, message, {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    // Success, no return value needed
  } catch (error: any) {
    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // Handle database connection errors
    if (error.code === "ECONNREFUSED" || error.code === "3D000") {
      throw new AppError(503, "Database service unavailable", {
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        success: false,
      });
    }

    // Re-throw the error for the controller to handle
    throw error;
  }
};

/**
 * Get follower count for a user
 * @param userId - UUID of the user
 * @returns Number of followers
 */
export const getFollowerCount = async (userId: string): Promise<number> => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*)::integer as count FROM public.follower WHERE followed_id = $1",
      [userId]
    );
    return result.rows[0]?.count || 0;
  } catch (error: any) {
    logger.error("Error getting follower count", { userId, error });
    throw new AppError(500, "Failed to get follower count", {
      code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
      success: false,
    });
  }
};

/**
 * Get following count for a user
 * @param userId - UUID of the user
 * @returns Number of following
 */
export const getFollowingCountController = async (userId: string): Promise<number> => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*)::integer as count FROM public.follower WHERE follower_id = $1",
      [userId]
    );
    return result.rows[0]?.count || 0;
  } catch (error: any) {
    logger.error("Error getting following count", { userId, error });
    throw new AppError(500, "Failed to get following count", {
      code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
      success: false,
    });
  }
};

/**
 * Get both follower and following counts for a user
 * @param userId - UUID of the user
 * @returns Object with followers_count and following_count
 */
export const getFollowCountsController = async (userId: string): Promise<{
  followers_count: number;
  following_count: number;
}> => {
  try {
    const [followerResult, followingResult] = await Promise.all([
      pool.query("SELECT COUNT(*)::integer as count FROM public.follower WHERE followed_id = $1", [userId]),
      pool.query("SELECT COUNT(*)::integer as count FROM public.follower WHERE follower_id = $1", [userId])
    ]);

    return {
      followers_count: followerResult.rows[0]?.count || 0,
      following_count: followingResult.rows[0]?.count || 0,
    };
  } catch (error: any) {
    logger.error("Error getting follow counts", { userId, error });
    throw new AppError(500, "Failed to get follow counts", {
      code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
      success: false,
    });
  }
};
