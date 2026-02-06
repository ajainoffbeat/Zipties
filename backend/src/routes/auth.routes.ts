import { Router } from "express";
import { forgotPassword, getProfile, login,resetPassword,signup, verifyResetToken } from "../controllers/auth.controller.js";
import { validateLoginMiddleware, validateSignupMiddleware } from "../middlewares/validation/auth.middleware.js";


const router = Router();
/**
 * POST /login
 * @summary Authenticate user and return login token
 * @tags Auth
 * @param {object} request.body.required - User credentials
 * @param {string} request.body.email.required - User email
 * @param {string} request.body.password.required - User password
 * 
 */
router.post("/login",validateLoginMiddleware, login);
router.post("/signup",validateSignupMiddleware,signup);
router.post("/forgot-password",forgotPassword);
router.get("/verify-reset-token", verifyResetToken);
router.post("/reset-password", resetPassword);
router.get("/profile/:userId", getProfile);
export default router;
