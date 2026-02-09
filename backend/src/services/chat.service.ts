import { pool } from "../config/db.js";

/**
 * Get or create a conversation between users
 * @param userIds - Array of user UUIDs
 * @param typeName - 'individual' or 'group'
 * @param sourceTypeName - Optional source type (e.g., 'post', 'listing')
 * @param sourceId - Optional source UUID
 * @param createdBy - UUID of creator
 * @returns conversation_id
 */
export const getOrCreateConversation = async (
  userIds: string[],
  typeName: string = 'individual',
  sourceTypeName?: string,
  sourceId?: string,
  createdBy?: string
): Promise<string> => {
  const result = await pool.query(
    "SELECT fn_get_or_create_conversation($1, $2, $3, $4, $5) as id",
    [userIds, typeName, sourceTypeName, sourceId, createdBy]
  );
  return result.rows[0].id;
};

/**
 * Add members to an existing conversation
 * @param conversationId - UUID of conversation
 * @param userIds - Array of user UUIDs to add
 */
export const addConversationMembers = async (
  conversationId: string,
  userIds: string[]
): Promise<void> => {
  await pool.query(
    "SELECT fn_add_conversation_members($1, $2)",
    [conversationId, userIds]
  );
};

/**
 * Send a message in a conversation
 * @param conversationId - UUID of conversation
 * @param senderId - UUID of sender
 * @param content - Message content
 * @param contentTypeName - 'text' or 'image' (default: 'text')
 * @returns message_id
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  contentTypeName: string = 'text'
): Promise<string> => {
  // 1. Check if any member has blocked the sender or vice-versa
  const blockCheck = await pool.query(
    `SELECT 1 
     FROM conversation_member cm
     JOIN user_report ur ON 
       (ur.user_id = $1 AND ur.blocked_user_id = cm.user_id) OR
       (ur.user_id = cm.user_id AND ur.blocked_user_id = $1)
     WHERE cm.conversation_id = $2 AND cm.user_id != $1
     LIMIT 1`,
    [senderId, conversationId]
  );

  if (blockCheck.rowCount && blockCheck.rowCount > 0) {
    throw new Error("Message blocked: One of the users has blocked the other.");
  }

  const result = await pool.query(
    "SELECT fn_send_message($1, $2, $3, $4) as id",
    [conversationId, senderId, content, contentTypeName]
  );
  return result.rows[0].id;
};

/**
 * Mark a conversation as read for a user
 * @param conversationId - UUID of conversation
 * @param userId - UUID of user
 * @param lastMessageId - UUID of last read message
 */
export const markConversationRead = async (
  conversationId: string,
  userId: string,
  lastMessageId: string
): Promise<void> => {
  await pool.query(
    "SELECT fn_mark_conversation_read($1, $2, $3)",
    [conversationId, userId, lastMessageId]
  );
};

/**
 * Get inbox for a user
 * @param userId - UUID of user
 * @returns Array of conversation objects with metadata
 */
export const getUserInbox = async (userId: string): Promise<any[]> => {
  const result = await pool.query(
    "SELECT * FROM fn_get_user_inbox($1)",
    [userId]
  );
  return result.rows;
};

/**
 * Get messages for a conversation (helper function)
 * @param conversationId - UUID of conversation
 * @param limit - Number of messages to retrieve (default: 50)
 * @param offset - Offset for pagination (default: 0)
 * @returns Array of message objects
 */
export const getConversationMessages = async (
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> => {
  const result = await pool.query(
    `SELECT 
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
    ORDER BY m.created_at ASC
    LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );
  return result.rows;
};
