import type { Request, Response } from "express";
import * as chatService from "../services/chat.service.js";
import * as socketService from "../services/socket.service.js";
import type {
  CreateConversationRequest,
  SendMessageRequest,
  MarkReadRequest,
  GetMessagesQuery,
  NewMessagePayload,
} from "../@types/conversation.types.js";
import { decodeToken, extractBearerToken } from "../utils/jwt.util.js";

/**
 * Create or get conversation
 */
export const createConversation = async (req: Request, res: Response) => {
  try {
    const { user_ids, type_name, source_type_name, source_id } =
      req.body as CreateConversationRequest;
    const token = extractBearerToken(req.headers.authorization);
    const {userId} = decodeToken(token);
    
 // From auth middleware

    const conversationId = await chatService.getOrCreateConversation(
      user_ids,
      type_name || "individual",
      source_type_name,
      source_id,
      userId,
    );

    res.status(200).json({
      status: 0,
      message: "Conversation created successfully",
      data: { conversation_id: conversationId },
    });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    res.status(500).json({
      status: 1,
      message: error.message || "Failed to create conversation",
    });
  }
};

/**
 * Send message (with socket emission)
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversation_id, content, content_type_name } =
      req.body as SendMessageRequest;
    const token = extractBearerToken(req.headers.authorization);
    const {userId} = decodeToken(token);
    console.log("sendMessage function called",userId)
    const username = (req as any).user?.username || "Unknown";

    // 1. Save message to DB via stored function
    const messageId = await chatService.sendMessage(
      conversation_id,
      userId,
      content,
      content_type_name || "text",
    );

    // 2. Prepare payload for socket emission
    const messagePayload: NewMessagePayload = {
      message_id: messageId,
      conversation_id,
      sender_id: userId,
      sender_name: username,
      content,
      content_type: content_type_name || "text",
      created_at: new Date().toISOString(),
    };

    // 3. Emit to online recipients (non-blocking)
    socketService.emitNewMessage(conversation_id, userId, messagePayload);

    res.status(200).json({
      status: 0,
      message: "Message sent successfully",
      data: { message_id: messageId },
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    res.status(500).json({
      status: 1,
      message: error.message || "Failed to send message",
    });
  }
};

/**
 * Mark conversation as read
 */
export const markConversationRead = async (req: Request, res: Response) => {
  try {
    const { conversation_id, last_message_id } = req.body as MarkReadRequest;
     const token = extractBearerToken(req.headers.authorization);
    const {userId} = decodeToken(token);


    await chatService.markConversationRead(
      conversation_id,
      userId,
      last_message_id,
    );

    res.status(200).json({
      status: 0,
      message: "Conversation marked as read",
    });
  } catch (error: any) {
    console.error("Error marking conversation read:", error);
    res.status(500).json({
      status: 1,
      message: error.message || "Failed to mark conversation as read",
    });
  }
};

/**
 * Get user inbox
 */
export const getUserInbox = async (req: Request, res: Response) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const {userId} = decodeToken(token);

    const inbox = await chatService.getUserInbox(userId);

    res.status(200).json({
      status: 0,
      message: "Inbox retrieved successfully",
      data: inbox,
    });
  } catch (error: any) {
    console.error("Error getting inbox:", error);
    res.status(500).json({
      status: 1,
      message: error.message || "Failed to get inbox",
    });
  }
};

/**
 * Get conversation messages
 */
export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.id as string;
    const { limit, offset } = req.query as GetMessagesQuery;

    const messages = await chatService.getConversationMessages(
      conversationId,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );

    res.status(200).json({
      status: 0,
      message: "Messages retrieved successfully",
      data: messages,
    });
  } catch (error: any) {
    console.error("Error getting messages:", error);
    res.status(500).json({
      status: 1,
      message: error.message || "Failed to get messages",
    });
  }
};
