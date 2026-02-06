import {  getProfile, editProfile } from "../controllers/user.contoroller.js";
import { Router } from "express";

const router = Router();
router.get("/profile/:userId", getProfile);
router.post("/editprofile", editProfile);
export default router;