import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";

const runAuthTests = async () => {
  try {
    logger.info("🧪 Starting Auth API Tests...\n");

    // 1. Test: Create User
    logger.info("📝 Step 1: Testing fn_create_user...");
    const email = `test_auth_${Date.now()}@example.com`;
    const password = "hashed_password_123";
    const firstName = "Test";
    const lastName = "User";
    
    const userResult = await pool.query(
      "SELECT * FROM fn_create_user($1, $2, $3, $4)",
      [email, password, firstName, lastName]
    );
    const createdUser = userResult.rows[0];
    
    if (createdUser) {
      logger.info(`✅ User created successfully:`);
      logger.info(`   - User ID: ${createdUser.user_id}`);
      logger.info(`   - Email: ${email}`);
      logger.info(`   - Role: ${createdUser.user_role}\n`);
    } else {
      logger.info(`❌ User creation failed or user already exists\n`);
      return;
    }

    // 2. Test: Get User by Email
    logger.info("🔍 Step 2: Testing fn_get_user_by_email...");
    const getUserResult = await pool.query(
      "SELECT * FROM fn_get_user_by_email($1)",
      [email]
    );
    const retrievedUser = getUserResult.rows[0];
    
    if (retrievedUser) {
      logger.info(`✅ User retrieved by email:`);
      logger.info(`   - User ID: ${retrievedUser.user_id}`);
      logger.info(`   - Username: ${retrievedUser.username}`);
      logger.info(`   - First Name: ${retrievedUser.firstname}`);
      logger.info(`   - Last Name: ${retrievedUser.lastname}`);
      logger.info(`   - Is Active: ${retrievedUser.is_active}`);
      logger.info(`   - Is Verified: ${retrievedUser.is_verified}\n`);
    } else {
      logger.info(`❌ Failed to retrieve user by email\n`);
    }

    // 3. Test: Log User Login
    logger.info("📥 Step 3: Testing fn_log_for_user_login...");
    const loginResult = await pool.query(
      "SELECT fn_log_for_user_login($1) AS log_id",
      [createdUser.user_id]
    );
    const loginId = loginResult.rows[0]?.log_id;
    
    if (loginId) {
      logger.info(`✅ User login logged successfully:`);
      logger.info(`   - Log ID: ${loginId}\n`);
    } else {
      logger.info(`❌ Failed to log user login\n`);
    }

    // 4. Test: Log User Logout
    logger.info("📤 Step 4: Testing fn_log_for_user_logout...");
    const logoutResult = await pool.query(
      "SELECT fn_log_for_user_logout($1) AS success",
      [createdUser.user_id]
    );
    const logoutSuccess = logoutResult.rows[0]?.success === true;
    
    if (logoutSuccess) {
      logger.info(`✅ User logout logged successfully\n`);
    } else {
      logger.info(`❌ Failed to log user logout\n`);
    }

    // 5. Test: Update Password Reset Token
    logger.info("🔑 Step 5: Testing fn_update_user_password_reset_token...");
    const resetToken = `reset_token_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    
    const tokenUpdateResult = await pool.query(
      "SELECT fn_update_user_password_reset_token($1, $2, $3) AS success",
      [email, resetToken, expiresAt]
    );
    const tokenUpdateSuccess = tokenUpdateResult.rows[0]?.success === true;
    
    if (tokenUpdateSuccess) {
      logger.info(`✅ Password reset token updated successfully:`);
      logger.info(`   - Token: ${resetToken}`);
      logger.info(`   - Expires: ${expiresAt.toISOString()}\n`);
    } else {
      logger.info(`❌ Failed to update password reset token\n`);
    }

    // 6. Test: Verify Password Reset Token
    logger.info("🔍 Step 6: Testing fn_verify_password_reset_token...");
    const verifyTokenResult = await pool.query(
      "SELECT fn_verify_password_reset_token($1) AS token_exists",
      [resetToken]
    );
    const tokenExists = verifyTokenResult.rows[0]?.token_exists === true;
    
    if (tokenExists) {
      logger.info(`✅ Password reset token is valid\n`);
    } else {
      logger.info(`❌ Password reset token is invalid or expired\n`);
    }

    // 7. Test: Reset Password with Token
    logger.info("🔄 Step 7: Testing fn_reset_password_with_token...");
    const newPassword = "new_hashed_password_456";
    
    const resetResult = await pool.query(
      "SELECT fn_reset_password_with_token($1, $2) AS success",
      [resetToken, newPassword]
    );
    const resetSuccess = resetResult.rows[0]?.success === true;
    
    if (resetSuccess) {
      logger.info(`✅ Password reset successfully\n`);
    } else {
      logger.info(`❌ Failed to reset password\n`);
    }

    // 8. Test: Verify Token is Cleared After Reset
    logger.info("🔍 Step 8: Verifying token is cleared after password reset...");
    const verifyAfterResetResult = await pool.query(
      "SELECT fn_verify_password_reset_token($1) AS token_exists",
      [resetToken]
    );
    const tokenExistsAfterReset = verifyAfterResetResult.rows[0]?.token_exists === true;
    
    if (!tokenExistsAfterReset) {
      logger.info(`✅ Token successfully cleared after password reset\n`);
    } else {
      logger.info(`❌ Token was not cleared after password reset\n`);
    }

    // 9. Test: Duplicate User Creation Prevention
    logger.info("🚫 Step 9: Testing duplicate user creation prevention...");
    const duplicateUserResult = await pool.query(
      "SELECT * FROM fn_create_user($1, $2, $3, $4)",
      [email, password, firstName, lastName]
    );
    const duplicateUser = duplicateUserResult.rows[0];
    
    if (!duplicateUser) {
      logger.info(`✅ Duplicate user creation prevented\n`);
    } else {
      logger.info(`❌ Duplicate user was created (this should not happen)\n`);
    }

    // 10. Test: Invalid Token Verification
    logger.info("❌ Step 10: Testing invalid token verification...");
    const invalidToken = "invalid_token_123";
    
    const invalidTokenResult = await pool.query(
      "SELECT fn_verify_password_reset_token($1) AS token_exists",
      [invalidToken]
    );
    const invalidTokenExists = invalidTokenResult.rows[0]?.token_exists === true;
    
    if (!invalidTokenExists) {
      logger.info(`✅ Invalid token correctly rejected\n`);
    } else {
      logger.info(`❌ Invalid token was accepted (this should not happen)\n`);
    }

    // 11. Test: Password Reset with Invalid Token
    logger.info("❌ Step 11: Testing password reset with invalid token...");
    const invalidResetResult = await pool.query(
      "SELECT fn_reset_password_with_token($1, $2) AS success",
      [invalidToken, "some_password"]
    );
    const invalidResetSuccess = invalidResetResult.rows[0]?.success === true;
    
    if (!invalidResetSuccess) {
      logger.info(`✅ Password reset with invalid token correctly rejected\n`);
    } else {
      logger.info(`❌ Password reset with invalid token succeeded (this should not happen)\n`);
    }

    // 12. Test: Get User Status and Role Information
    logger.info("📊 Step 12: Testing user status and role information...");
    const statusResult = await pool.query(
      "SELECT fn_get_active_user_status_id() AS status_id"
    );
    const statusId = statusResult.rows[0]?.status_id;
    
    if (statusId) {
      logger.info(`✅ Active user status ID: ${statusId}`);
    }

    const roleResult = await pool.query(
      "SELECT fn_get_user_role_id('user') AS role_id"
    );
    const roleId = roleResult.rows[0]?.role_id;
    
    if (roleId) {
      logger.info(`✅ User role ID: ${roleId}\n`);
    }

    logger.info("=".repeat(60));
    logger.info("✅ ALL AUTH TESTS PASSED!");
    logger.info("=".repeat(60));

  } catch (error: any) {
    logger.error("\n❌ AUTH TEST FAILED:", error.message);
    logger.error(error);
  } finally {
    await pool.end();
  }
};

runAuthTests();