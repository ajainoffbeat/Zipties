import { Router } from "express";
import * as conversationController from "../controllers/conversation.controller.js";

const router = Router();

/**
 * POST /api/conversation/create
 * Create or get existing conversation
 */
router.post("/create", conversationController.createConversation);

/**
 * POST /api/conversation/message
 * Send a message (triggers socket emission)
 */
router.post("/message", conversationController.sendMessage);

/**
 * POST /api/conversation/read
 * Mark conversation as read
 */
router.post("/read", conversationController.markConversationRead);

/**
 * GET /api/conversation/inbox
 * Get user's inbox
 */
router.get("/inbox", conversationController.getUserInbox);

/**
 * GET /api/conversation/:id/messages
 * Get messages for a conversation
 */
router.get("/:id/messages", conversationController.getConversationMessages);

export default router;
