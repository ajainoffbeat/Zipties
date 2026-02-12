import { Router } from "express";
import { createConversation, sendMessage, markConversationRead, getUserInbox, getConversationMessages } from "../controllers/conversation.controller.js";

const router = Router();
router.post("/create", createConversation);
router.post("/message", sendMessage);
router.post("/read", markConversationRead);
router.get("/inbox", getUserInbox);
router.get("/:id/messages", getConversationMessages);

export default router;
