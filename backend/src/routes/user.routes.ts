import { getProfile, getProfileById, editProfile, getCities, uploadAvatar, searchUsers } from "../controllers/user.contoroller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.get("/profile", getProfile);
router.get("/profile/:userId", getProfileById);
// router.get("/profile/username/:username", getProfileByUsername);
router.post("/editprofile", editProfile);
router.get("/cities", getCities);
router.get("/search", searchUsers);
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);
export default router;