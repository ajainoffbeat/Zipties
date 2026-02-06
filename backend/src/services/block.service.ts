import { pool } from "../config/db.js";
import type { BlockUserResponse } from "../@types/block.types.js";
import { AppError } from "../utils/response/appError.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";

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
  comment?: string
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
    // Choose the appropriate stored procedure based on isBlocking parameter
    if (isBlocking) {
      // Block operation: sp_block_user(p_user_id, p_blocked_user_id, p_comment)
      const result = await pool.query(
        'SELECT * FROM sp_block_user($1, $2, $3)',
        [userBlocking, userBlocked, comment || null]
      );

      // Check if the operation was successful
      if (!result.rows[0]?.success) {
        const message = result.rows[0]?.message || 'Block operation failed';
        
        // Handle specific error cases
        if (message.includes('already blocked')) {
          throw new AppError(409, message, {
            code: RESPONSE_CODES.USER_ALREADY_EXISTS,
            success: false,
          });
        }
        
        if (message.includes('do not exist') || message.includes('required')) {
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
      // Unblock operation: sp_unblock_user(p_user_id, p_blocked_user_id)
      const result = await pool.query(
        'SELECT * FROM sp_unblock_user($1, $2)',
        [userBlocking, userBlocked]
      );

      // Check if the operation was successful
      if (!result.rows[0]?.success) {
        const message = result.rows[0]?.message || 'Unblock operation failed';
        
        // Handle specific error cases
        if (message.includes('not found')) {
          throw new AppError(404, message, {
            code: RESPONSE_CODES.USER_NOT_FOUND,
            success: false,
          });
        }
        
        if (message.includes('required') || message.includes('Invalid operation')) {
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
    if (error.code === 'ECONNREFUSED' || error.code === '3D000') {
      throw new AppError(503, "Database service unavailable", {
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        success: false,
      });
    }
    
    // Re-throw the error for the controller to handle
    throw error;
  }
};
