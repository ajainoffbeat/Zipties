import { pool } from "../config/db.js";
import type { Server } from "socket.io";
import type { NewMessagePayload } from "../@types/conversation.types.js";
import { logger } from "../utils/logger.js";

let io: Server | null = null;

/**
 * Initialize Socket.IO instance
 */
export const initializeSocketIO = (socketServer: Server) => {
  io = socketServer;
};

/**
 * Get Socket.IO instance
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

/**
 * Update user's socket ID in database
 */
export const updateUserSocket = async (
  userId: string,
  socketId: string
): Promise<void> => {
  await pool.query("SELECT fn_update_user_socket($1, $2)", [userId, socketId]);
};

/**
 * Clear user's socket ID from database
 */
export const clearUserSocket = async (socketId: string): Promise<void> => {
  await pool.query("SELECT fn_clear_user_socket($1)", [socketId]);
};

/**
 * Get conversation member sockets (excluding sender)
 */
export const getConversationSockets = async (
  conversationId: string,
  senderId: string
): Promise<Array<{ user_id: string; socket_id: string; username: string }>> => {
  const result = await pool.query(
    "SELECT * FROM fn_get_conversation_sockets($1, $2)",
    [conversationId, senderId]
  );
  return result.rows;
};

/**
 * Get user by socket ID
 */
export const getUserBySocket = async (
  socketId: string
): Promise<{ user_id: string; username: string; email: string } | null> => {
  const result = await pool.query("SELECT * FROM fn_get_user_by_socket($1)", [
    socketId,
  ]);
  return result.rows[0] || null;
};

/**
 * Emit new message to conversation recipients
 */
export const emitNewMessage = async (
  conversationId: string,
  senderId: string,
  messagePayload: NewMessagePayload
): Promise<void> => {
  try {
    const recipients = await getConversationSockets(conversationId, senderId);
    if (!io) {
      logger.warn("Socket.IO not initialized, skipping emit");
      return;
    }

    // Emit to each online recipient
    recipients.forEach((recipient) => {
      io!.to(recipient.socket_id).emit("new_message", messagePayload);
    });

    logger.info(
      `Emitted message to ${recipients.length} online recipient(s) in conversation ${conversationId}`
    );
  } catch (error) {
    logger.error("Error emitting new message", { error });
    // Don't throw - socket emission failure shouldn't break the API
  }
};

/**
 * Emit typing indicator to conversation
 */
export const emitTypingIndicator = async (
  conversationId: string,
  userId: string,
  username: string,
  isTyping: boolean
): Promise<void> => {
  try {
    const recipients = await getConversationSockets(conversationId, userId);

    if (!io) return;

    recipients.forEach((recipient) => {
      io!.to(recipient.socket_id).emit("user_typing", {
        conversation_id: conversationId,
        user_id: userId,
        username,
        is_typing: isTyping,
      });
    });
  } catch (error) {
    logger.error("Error emitting typing indicator", { error });
  }
};
