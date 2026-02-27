import { Router } from "express";
import { forgotPassword, login,logout,resetPassword,signup, verifyResetToken } from "../controllers/auth.controller.js";
import { validateLoginMiddleware, validateSignupMiddleware } from "../middlewares/validation/auth.middleware.js";


const router = Router();
router.post("/login",validateLoginMiddleware, login);
router.post("/signup",validateSignupMiddleware,signup);
router.post("/forgot-password",forgotPassword);
router.get("/verify-reset-token", verifyResetToken);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);

export default router;
