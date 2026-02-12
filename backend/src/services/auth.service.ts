import { pool } from "../config/db.js";
import type { CreateUserRequest, UserResponse } from "../@types/user.types.js";
import { logger } from "../utils/logger.js";

export const createUser = async (newUser: CreateUserRequest): Promise<UserResponse | null> => {
  try {
    logger.debug('Creating new user', { email: newUser.email });
    
    const result = await pool.query(
      "SELECT * FROM fn_create_user($1, $2, $3, $4)",
      [newUser.email, newUser.password_hash, newUser.first_name, newUser.last_name]
    );
    
    const createdUser = result.rows[0];
    if (createdUser) {
      logger.info('User created successfully', { 
        userId: createdUser.user_id, 
        email: newUser.email 
      });
    }
    
    return createdUser || null;
  } catch (error) {
    logger.error('Failed to create user', { 
      email: newUser.email, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

export const getUserByEmail = async (email: string): Promise<UserResponse | null> => {
  try {
    logger.debug('Looking up user by email', { email });
    
    const result = await pool.query(
      "SELECT * FROM fn_get_user_by_email($1)",
      [email.toLowerCase().trim()]
    );
    
    const user = result.rows[0];
    if (user) {
      logger.debug('User found by email', { 
        userId: user.user_id, 
        email 
      });
    } else {
      logger.debug('No user found for email', { email });
    }
    
    return user || null;
  } catch (error) {
    logger.error('Failed to get user by email', { 
      email, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
};

export const updateUserPasswordResetToken = async (
  email: string,
  token: string,
  expires: Date
): Promise<boolean> => {
  try {
    logger.debug('Updating password reset token', { email });
    
    const result = await pool.query(
      "SELECT fn_update_user_password_reset_token($1, $2, $3) AS success",
      [email, token, expires]
    );
    
    const success = result.rows[0]?.success === true;
    if (success) {
      logger.debug('Password reset token updated successfully', { email });
    } else {
      logger.warn('Failed to update password reset token', { email });
    }
    
    return success;
  } catch (error) {
    logger.error('Failed to update password reset token', { 
      email, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
};


export const logUserLogin = async (userId: string): Promise<string | null> => {
  try {
    logger.debug('Logging user login attempt', { userId });
    
  const result = await pool.query(
    "SELECT fn_log_for_user_login ($1) AS log_id",
    [userId]
  );
    
    const loginId = result.rows[0]?.log_id;
    if (loginId) {
      logger.info('User login logged successfully', { userId, loginId });
    } else {
      logger.warn('Failed to log user login - no ID returned', { userId });
    }
    
    return loginId;
  } catch (error) {
    logger.error('Failed to log user login', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
};

export const logUserLogout = async (userId: string): Promise<boolean> => {
  try {
    logger.debug('Logging user logout attempt', { userId });
    
  const result = await pool.query(
    "SELECT fn_log_for_user_logout($1) AS success",
    [userId]
  );
    
    const success = result.rows[0]?.success === true;
    if (success) {
      logger.info('User logout logged successfully', { userId });
    } else {
      logger.warn('Failed to log user logout', { userId });
    }
    
    return success;
  } catch (error) {
    logger.error('Failed to log user logout', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
};

export const verifyPasswordResetToken = async (token: string): Promise<boolean> => {
  try {
    logger.debug('Verifying password reset token');
    
    const result = await pool.query(
    "SELECT fn_verify_password_reset_token($1) AS token_exists",
      [token]
    );
    
    const isValid = result.rows[0]?.token_exists == true;
    if (isValid) {
      logger.debug('Password reset token is valid');
    } else {
      logger.debug('Password reset token is invalid or expired');
    }
    
    return isValid;
  } catch (error) {
    logger.error('Failed to verify password reset token', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
};


export const resetUserPasswordByToken = async (
  token: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    logger.debug('Resetting password with token');
    
    const result = await pool.query(
      "SELECT fn_reset_password_with_token($1, $2) AS success",
      [token, hashedPassword]
    );
    
    const success = result.rows[0]?.success === true;
    if (success) {
      logger.info('Password reset successfully');
    } else {
      logger.warn('Failed to reset password - token may be invalid');
    }
    
    return success;
  } catch (error) {
    logger.error('Failed to reset password by token', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
};

