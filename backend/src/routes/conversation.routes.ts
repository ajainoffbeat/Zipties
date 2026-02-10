import { Router } from "express";
import * as conversationController from "../controllers/conversation.controller.js";

const router = Router();
router.post("/create", conversationController.createConversation);
router.post("/message", conversationController.sendMessage);
router.post("/read", conversationController.markConversationRead);
router.get("/inbox", conversationController.getUserInbox);
router.get("/:id/messages", conversationController.getConversationMessages);

export default router;
