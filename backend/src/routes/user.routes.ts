import {  getProfileById, editProfile, getCities, uploadAvatar, searchUsers, blockUser, followUser, unfollowUser, getFollowCounts } from "../controllers/user.contoroller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { getFollowerCount } from "../services/user.service.js";


const router = Router();
router.get("/profile/:userId", getProfileById);
// router.get("/profile/username/:username", getProfileByUsername);
router.post("/editprofile", editProfile);
router.get("/cities", getCities);
router.get("/search", searchUsers);
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);
router.post("/block", blockUser);
router.post("/follow/:userId", followUser);
router.post("/unfollow/:userId", unfollowUser);

// Follow count endpoints
router.get("/followers/:userId", getFollowerCount);
router.get("/following/:userId", getFollowCounts);
router.get("/follow-counts/:userId", getFollowCounts);

export default router;