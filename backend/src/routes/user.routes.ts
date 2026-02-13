import {  getProfileById, editProfile, getCities, uploadAvatar, searchUsers, blockUser } from "../controllers/user.contoroller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();
router.get("/profile/:userId", getProfileById);
// router.get("/profile/username/:username", getProfileByUsername);
router.post("/editprofile", editProfile);
router.get("/cities", getCities);
router.get("/search", searchUsers);
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);
router.post("/block", blockUser);

export default router;