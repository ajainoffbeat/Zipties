import { Router } from "express";
import * as blockController from "../controllers/block.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
router.post("/user", authMiddleware, blockController.blockUser);

export default router;
