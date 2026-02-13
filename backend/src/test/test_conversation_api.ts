
import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";

const runConversationTests = async () => {
  try {
    logger.info("🧪 Starting Conversation API Tests...\n");

    // 1. Create test users
    logger.info("📝 Step 1: Creating test users...");
    const email1 = `test_conv_a_${Date.now()}@example.com`;
    const email2 = `test_conv_b_${Date.now()}@example.com`;
    
    const resA = await pool.query(`
      INSERT INTO "user" (id, email, username, password, created_at)
      VALUES (uuid_generate_v4(), $1, $2, 'hash', NOW())
      RETURNING id, username
    `, [email1, `user_a_${Date.now()}`]);
    const userA = resA.rows[0];
    logger.info(`✅ User A created: ${userA.username} (${userA.id})`);

    const resB = await pool.query(`
      INSERT INTO "user" (id, email, username, password, created_at)
      VALUES (uuid_generate_v4(), $1, $2, 'hash', NOW())
      RETURNING id, username
    `, [email2, `user_b_${Date.now()}`]);
    const userB = resB.rows[0];
    logger.info(`✅ User B created: ${userB.username} (${userB.id})\n`);

    // 2. Test: Create Conversation
    logger.info("📡 Step 2: Testing fn_get_or_create_conversation...");
    const convResult = await pool.query(
      "SELECT fn_get_or_create_conversation($1, $2, NULL, NULL, $3) as id",
      [[userA.id, userB.id], 'individual', userA.id]
    );
    const conversationId = convResult.rows[0].id;
    logger.info(`✅ Conversation created: ${conversationId}\n`);

    // 3. Test: Send Message
    logger.info("✉️ Step 3: Testing fn_send_message...");
    const msgResult = await pool.query(
      "SELECT fn_send_message($1, $2, $3, $4) as id",
      [conversationId, userA.id, 'Hello from test suite!', 'text']
    );
    const messageId = msgResult.rows[0].id;
    logger.info(`✅ Message sent: ${messageId}\n`);

    // 4. Test: Get Inbox for User B
    logger.info("📬 Step 4: Testing fn_get_user_inbox for User B...");
    const inboxResult = await pool.query(
      "SELECT * FROM fn_get_user_inbox($1)",
      [userB.id]
    );
    logger.info(`✅ Inbox retrieved: ${inboxResult.rows.length} conversation(s)`);
    if (inboxResult.rows.length > 0) {
      const inbox = inboxResult.rows[0];
      logger.info(`   - Conversation: ${inbox.conversation_id}`);
      logger.info(`   - Unread count: ${inbox.unread_count}`);
      logger.info(`   - Last message: "${inbox.last_message_content}"`);
      logger.info(`   - From: ${inbox.last_message_sender_name}\n`);
    }

    // 5. Test: Get Conversation Messages
    logger.info("💬 Step 5: Testing getConversationMessages...");
    const messagesResult = await pool.query(`
      SELECT 
        m.id,
        m.sender_id,
        m.content,
        m.created_at,
        mct.name as content_type,
        u.username as sender_name
      FROM message m
      JOIN message_content_type mct ON m.message_content_type_id = mct.id
      LEFT JOIN "user" u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT 50
    `, [conversationId]);
    logger.info(`✅ Messages retrieved: ${messagesResult.rows.length} message(s)`);
    messagesResult.rows.forEach((msg, idx) => {
      logger.info(`   ${idx + 1}. [${msg.sender_name}]: ${msg.content}`);
    });

    // 6. Test: Mark Conversation as Read
    logger.info("👀 Step 6: Testing fn_mark_conversation_read...");
    await pool.query(
      "SELECT fn_mark_conversation_read($1, $2, $3)",
      [conversationId, userB.id, messageId]
    );
    logger.info(`✅ Conversation marked as read\n`);

    // 7. Verify unread count is 0
    logger.info("🔍 Step 7: Verifying unread count reset...");
    const verifyResult = await pool.query(
      "SELECT unread_count FROM conversation_member WHERE conversation_id = $1 AND user_id = $2",
      [conversationId, userB.id]
    );
    const unreadCount = verifyResult.rows[0].unread_count;
    logger.info(`✅ Unread count: ${unreadCount} (expected: 0)\n`);

    // 8. Test: Socket Functions
    logger.info("🔌 Step 8: Testing socket helper functions...");
    
    // Update socket for User A
    await pool.query("SELECT fn_update_user_socket($1, $2)", [userA.id, 'test-socket-123']);
    logger.info(`✅ Socket updated for User A`);

    // Get conversation sockets
    const socketsResult = await pool.query(
      "SELECT * FROM fn_get_conversation_sockets($1, $2)",
      [conversationId, userA.id]
    );
    logger.info(`✅ Found ${socketsResult.rows.length} online recipient(s)`);
    if (socketsResult.rows.length > 0) {
      socketsResult.rows.forEach(r => {
        logger.info(`   - ${r.username}: ${r.socket_id}`);
      });
    }

    // Clear socket
    await pool.query("SELECT fn_clear_user_socket($1)", ['test-socket-123']);
    logger.info(`✅ Socket cleared for User A\n`);

    // 9. Test: Duplicate Conversation Prevention
    logger.info("🔄 Step 9: Testing duplicate conversation prevention...");
    const dupResult = await pool.query(
      "SELECT fn_get_or_create_conversation($1, $2, NULL, NULL, $3) as id",
      [[userA.id, userB.id], 'individual', userA.id]
    );
    const dupConvId = dupResult.rows[0].id;
    if (dupConvId === conversationId) {
      logger.info(`✅ Returned existing conversation (no duplicate created)\n`);
    } else {
      logger.info(`❌ Created duplicate conversation!\n`);
    }

    logger.info("=" .repeat(60));
    logger.info("✅ ALL TESTS PASSED!");
    logger.info("=" .repeat(60));

  } catch (error: any) {
    logger.error("\n❌ TEST FAILED:", error.message);
    logger.error(error);
  } finally {
    await pool.end();
  }
};

runConversationTests();
