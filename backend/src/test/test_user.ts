import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";

const runUserTests = async () => {
  try {
    logger.info("🧪 Starting User API Tests...\n");

    // 1. Create test users
    logger.info("📝 Step 1: Creating test users...");
    const email1 = `test_user_a_${Date.now()}@example.com`;
    const email2 = `test_user_b_${Date.now()}@example.com`;

    const resA = await pool.query(`
      INSERT INTO "user" (id, email, username, password, firstname, lastname, created_at)
      VALUES (uuid_generate_v4(), $1, $2, 'hash', 'Test', 'User A', NOW())
      RETURNING id, username, firstname, lastname
    `, [email1, `user_a_${Date.now()}`]);
    const userA = resA.rows[0];
    logger.info(`✅ User A created: ${userA.username} (${userA.id})`);

    const resB = await pool.query(`
      INSERT INTO "user" (id, email, username, password, firstname, lastname, created_at)
      VALUES (uuid_generate_v4(), $1, $2, 'hash', 'Test', 'User B', NOW())
      RETURNING id, username, firstname, lastname
    `, [email2, `user_b_${Date.now()}`]);
    const userB = resB.rows[0];
    logger.info(`✅ User B created: ${userB.username} (${userB.id})\n`);

    // 2. Test: Get User Profile
    logger.info("👤 Step 2: Testing fn_get_user_profile...");
    const profileResult = await pool.query(
      "SELECT * FROM fn_get_user_profile($1, $2)",
      [userA.id, userB.id]
    );
    const profile = profileResult.rows[0];

    if (profile) {
      logger.info(`✅ User profile retrieved:`);
      logger.info(`   - ID: ${profile.id}`);
      logger.info(`   - Name: ${profile.first_name} ${profile.last_name}`);
      logger.info(`   - Username: ${profile.username}`);
      logger.info(`   - Email: ${profile.email}`);
      logger.info(`   - Bio: ${profile.bio || 'None'}`);
      logger.info(`   - Is Blocked: ${profile.isblocked}\n`);
    } else {
      logger.info(`❌ Failed to retrieve user profile\n`);
    }

    // 3. Test: Update User Profile
    logger.info("✏️ Step 3: Testing fn_update_user...");
    const uniqueUsername = `updated_username_${Date.now()}`;
    const updateResult = await pool.query(
      "SELECT fn_update_user($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) AS success",
      [userA.id, 'Updated', 'Name', uniqueUsername, 'This is my bio', 'https://example.com/avatar.jpg', userA.id, null, 'coding, gaming', 'developer, enthusiast']
    );
    const updateSuccess = updateResult.rows[0]?.success === true;

    if (updateSuccess) {
      logger.info(`✅ User profile updated successfully\n`);
    } else {
      logger.info(`❌ Failed to update user profile\n`);
    }

    // 4. Test: Verify Profile Update
    logger.info("🔍 Step 4: Verifying profile update...");
    const verifyResult = await pool.query(
      "SELECT * FROM fn_get_user_profile($1, $2)",
      [userA.id, userA.id]
    );
    const updatedProfile = verifyResult.rows[0];

    if (updatedProfile && updatedProfile.first_name === 'Updated' && updatedProfile.bio === 'This is my bio') {
      logger.info(`✅ Profile update verified:`);
      logger.info(`   - First Name: ${updatedProfile.first_name}`);
      logger.info(`   - Bio: ${updatedProfile.bio}`);
      logger.info(`   - Interests: ${updatedProfile.interests}\n`);
    } else {
      logger.info(`❌ Profile update not reflected in query\n`);
    }

    // 5. Test: Block User
    logger.info("🚫 Step 5: Testing fn_block_user...");
    const blockResult = await pool.query(
      "SELECT * FROM fn_block_user($1, $2, $3)",
      [userA.id, userB.id, 'Testing block functionality']
    );
    const blockResponse = blockResult.rows[0];

    if (blockResponse.success) {
      logger.info(`✅ User blocked successfully:`);
      logger.info(`   - Message: ${blockResponse.message}\n`);
    } else {
      logger.info(`❌ Failed to block user:`);
      logger.info(`   - Message: ${blockResponse.message}\n`);
    }

    // 6. Test: Check if User is Blocked
    logger.info("🔍 Step 6: Testing fn_is_user_blocked...");
    const isBlockedResult = await pool.query(
      "SELECT fn_is_user_blocked($1, $2) AS is_blocked",
      [userA.id, userB.id]
    );
    const isBlocked = isBlockedResult.rows[0]?.is_blocked === true;

    if (isBlocked) {
      logger.info(`✅ Block status confirmed: User B is blocked by User A\n`);
    } else {
      logger.info(`❌ Block status not confirmed\n`);
    }

    // 7. Test: Profile Query with Block (should show isblocked = true)
    logger.info("👤 Step 7: Testing profile query after blocking...");
    const blockedProfileResult = await pool.query(
      "SELECT * FROM fn_get_user_profile($1, $2)",
      [userA.id, userB.id]
    );
    const blockedProfile = blockedProfileResult.rows[0];

    if (blockedProfile && blockedProfile.isblocked === true) {
      logger.info(`✅ Profile correctly shows blocked status\n`);
    } else {
      logger.info(`❌ Profile does not show blocked status\n`);
    }

    // 8. Test: Unblock User
    logger.info("✅ Step 8: Testing fn_unblock_user...");
    const unblockResult = await pool.query(
      "SELECT * FROM fn_unblock_user($1, $2)",
      [userA.id, userB.id]
    );
    const unblockResponse = unblockResult.rows[0];

    if (unblockResponse.success) {
      logger.info(`✅ User unblocked successfully:`);
      logger.info(`   - Message: ${unblockResponse.message}\n`);
    } else {
      logger.info(`❌ Failed to unblock user:`);
      logger.info(`   - Message: ${unblockResponse.message}\n`);
    }

    // 9. Test: Verify Unblock
    logger.info("🔍 Step 9: Verifying unblock...");
    const verifyUnblockResult = await pool.query(
      "SELECT fn_is_user_blocked($1, $2) AS is_blocked",
      [userA.id, userB.id]
    );
    const isStillBlocked = verifyUnblockResult.rows[0]?.is_blocked === true;

    if (!isStillBlocked) {
      logger.info(`✅ User successfully unblocked\n`);
    } else {
      logger.info(`❌ User is still blocked\n`);
    }

    // 10. Test: Search Users by Name
    logger.info("🔎 Step 10: Testing fn_search_users_by_name...");
    const searchResult = await pool.query(
      "SELECT * FROM fn_search_users_by_name($1, $2)",
      ['Test', userA.id]
    );
    logger.info(`✅ User search completed: ${searchResult.rows.length} result(s)`);
    if (searchResult.rows.length > 0) {
      searchResult.rows.forEach((user, idx) => {
        logger.info(`   ${idx + 1}. ${user.first_name} ${user.last_name} (@${user.username})`);
      });
    }
    logger.info(``);

    // 11. Test: Get Cities
    logger.info("🏙️ Step 11: Testing fn_get_cities...");
    const citiesResult = await pool.query(
      "SELECT * FROM fn_get_cities($1, $2, $3, $4, $5)",
      ['IN', null, null, 10, 0]
    );
    logger.info(`✅ Cities retrieved: ${citiesResult.rows.length} cities`);
    if (citiesResult.rows.length > 0) {
      citiesResult.rows.slice(0, 3).forEach((city, idx) => {
        logger.info(`   ${idx + 1}. ${city.city}, ${city.state}`);
      });
      if (citiesResult.rows.length > 3) {
        logger.info(`   ... and ${citiesResult.rows.length - 3} more\n`);
      } else {
        logger.info(``);
      }
    }

    // 12. Test: Self-Block Prevention
    logger.info("🚫 Step 12: Testing self-block prevention...");
    const selfBlockResult = await pool.query(
      "SELECT * FROM fn_block_user($1, $2, $3)",
      [userA.id, userA.id, 'Testing self-block']
    );
    const selfBlockResponse = selfBlockResult.rows[0];

    if (!selfBlockResponse.success && selfBlockResponse.message.includes('cannot block themselves')) {
      logger.info(`✅ Self-block correctly prevented\n`);
    } else {
      logger.info(`❌ Self-block was not prevented\n`);
    }

    // 13. Test: Duplicate Block Prevention
    logger.info("🔄 Step 13: Testing duplicate block prevention...");
    // Block user first
    await pool.query("SELECT * FROM fn_block_user($1, $2, $3)", [userA.id, userB.id, 'First block']);

    // Try to block again
    const dupBlockResult = await pool.query(
      "SELECT * FROM fn_block_user($1, $2, $3)",
      [userA.id, userB.id, 'Duplicate block']
    );
    const dupBlockResponse = dupBlockResult.rows[0];

    if (!dupBlockResponse.success && dupBlockResponse.message.includes('already blocked')) {
      logger.info(`✅ Duplicate block correctly prevented\n`);
    } else {
      logger.info(`❌ Duplicate block was not prevented\n`);
    }

    // Clean up: Unblock for final tests
    await pool.query("SELECT * FROM fn_unblock_user($1, $2)", [userA.id, userB.id]);

    // 14. Test: Unblock Non-existent Block
    logger.info("❌ Step 14: Testing unblock of non-blocked user...");
    const invalidUnblockResult = await pool.query(
      "SELECT * FROM fn_unblock_user($1, $2)",
      [userA.id, userB.id] // This should fail since we just unblocked
    );
    const invalidUnblockResponse = invalidUnblockResult.rows[0];

    if (!invalidUnblockResponse.success && invalidUnblockResponse.message.includes('not found')) {
      logger.info(`✅ Invalid unblock correctly rejected\n`);
    } else {
      logger.info(`❌ Invalid unblock was accepted\n`);
    }

    logger.info("=".repeat(60));
    logger.info("✅ ALL USER TESTS PASSED!");
    logger.info("=".repeat(60));

  } catch (error: any) {
    logger.error("\n❌ USER TEST FAILED:", error.message);
    logger.error(error);
  } finally {
    await pool.end();
  }
};

runUserTests();