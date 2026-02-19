import { Router } from "express";
import {
  createPostController,
  editPostController,
  deletePostController,
  getPostController,
  getPostsController,
  searchPostsController,
} from "../controllers/post.controller.js";
import { uploadPostImages } from "../middlewares/multer.middleware.js";

const router = Router();

// Get posts for home page (with pagination)
router.get("/", getPostsController);

// Get single post
router.get("/get/:postId", getPostController);

// Search posts
router.get("/search", searchPostsController);

// Create a new post
router.post(
  "/create",
  uploadPostImages.array("images", 5),
  createPostController,
);

// Edit an existing post (content update and image management)
router.put("/edit/:postId", uploadPostImages.array("images", 5), editPostController);

// Delete a post
router.delete("/delete/:postId", deletePostController);

export default router;
