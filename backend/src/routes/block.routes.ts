import { Router } from "express";
import * as blockController from "../controllers/block.controller.js";

const router = Router();

/**
 * POST /api/block/user
 * Block a user
 * Body: { to_block_id: string, who_is_blocking: string }
 */
router.post("/user", blockController.blockUser);

export default router;
