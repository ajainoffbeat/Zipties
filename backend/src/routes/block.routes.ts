import { Router } from "express";
import * as blockController from "../controllers/block.controller.js";

const router = Router();
router.post("/user", blockController.blockUser);

export default router;
