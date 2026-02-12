
import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";

const runVerification = async () => {
  try {

    // 1. Create 2 Users via SQL directly to avoid auth role issues
    const email1 = `test_user_a_${Date.now()}@example.com`;
    const email2 = `test_user_b_${Date.now()}@example.com`;
    
    const resA = await pool.query(`
        INSERT INTO "user" (id, email, username, password, created_at)
        VALUES (uuid_generate_v4(), $1, $2, 'hash', NOW())
        RETURNING id
    `, [email1, `user_a_${Date.now()}`]);
    const userA = { id: resA.rows[0].id };

    const resB = await pool.query(`
        INSERT INTO "user" (id, email, username, password, created_at)
        VALUES (uuid_generate_v4(), $1, $2, 'hash', NOW())
        RETURNING id
    `, [email2, `user_b_${Date.now()}`]);
    const userB = { id: resB.rows[0].id };

    // 2. Create Conversation
    const resConv = await pool.query(
        "SELECT fn_get_or_create_conversation($1, $2, $3, $4, $5) as id",
        [[userA.id, userB.id], 'individual', null, null, userA.id]
    );
    const conversationId = resConv.rows[0].id;

    // 3. Send Message from A to B
    const msgContent = "Hello from Antigravity!";
    const resMsg = await pool.query(
        "SELECT fn_send_message($1, $2, $3, $4) as id",
        [conversationId, userA.id, msgContent, 'text']
    );
    const messageId = resMsg.rows[0].id;

    // 4. Verify Unread Count for B
    const resUnread = await pool.query(
        "SELECT unread_count FROM conversation_member WHERE conversation_id = $1 AND user_id = $2",
        [conversationId, userB.id]
    );
    const unreadCount = resUnread.rows[0].unread_count;
    if (unreadCount !== 1) throw new Error("Expected unread_count to be 1");

    // 5. Get Inbox for B (Step 7)
    const resInbox = await pool.query(
        "SELECT * FROM fn_get_user_inbox($1)",
        [userB.id]
    );
    if (resInbox.rows[0].last_message_content !== msgContent) throw new Error("Inbox last message content mismatch");

    // 6. Mark Read (Step 6)
    await pool.query(
        "SELECT fn_mark_conversation_read($1, $2, $3)",
        [conversationId, userB.id, messageId]
    );

    // 7. Verify Unread Count is 0
    const resUnreadFinal = await pool.query(
        "SELECT unread_count FROM conversation_member WHERE conversation_id = $1 AND user_id = $2",
        [conversationId, userB.id]
    );
    if (resUnreadFinal.rows[0].unread_count !== 0) throw new Error("Expected unread_count to be 0");

  } catch (err) {
    logger.error("\n❌ VERIFICATION FAILED:", { error: err });
  } finally {
    pool.end();
  }
};

runVerification();
