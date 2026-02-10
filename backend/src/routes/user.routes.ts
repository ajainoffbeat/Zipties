import {  getProfile, editProfile, getCities } from "../controllers/user.contoroller.js";
import { Router } from "express";

const router = Router();
router.get("/profile/:userId", getProfile);
router.post("/editprofile", editProfile);
router.get("/cities", getCities);
export default router;