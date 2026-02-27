import type { Response, Request, NextFunction } from "express";
import fs from "fs/promises";
import { decodeToken, extractBearerToken } from "../utils/jwt.util.js";
import {
  createPost,
  getPosts,
  getPost,
  deletePost,
  editPost,
  searchPosts,
  getPostComments,
  createPostComment,
  togglePostLike,
  blockPost,
  reportPost,
  reportComment,
  createPostAssets,
} from "../services/post.service.js";
import { AppError } from "../utils/response/appError.js";
import { sendSuccess } from "../utils/response/appSuccess.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";
import { RESPONSE_MESSAGES } from "../constants/responseMessages.constant.js";
import { logger } from "../utils/logger.js";
import { uploadToS3 } from "../services/s3.service.js";

export const createPostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    const decoded = decodeToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const userId = decoded.userId as string;
    const { content } = req.body;

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      throw new AppError(
        400,
        "Content is required and must be a non-empty string",
        {
          code: RESPONSE_CODES.BAD_REQUEST,
          success: false,
        },
      );
    }

    if (content.length > 200) {
      throw new AppError(400, "Content must not exceed 200 characters", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    const files = req.files as Express.Multer.File[];
    if (files && Array.isArray(files) && files.length > 0) {
      const maxSize = 2 * 1024 * 1024;
      const exceeds = files.some((file) => file.size > maxSize);
      if (exceeds) {
        throw new AppError(400, "Image size exceeded", {
          code: RESPONSE_CODES.BAD_REQUEST,
          success: false,
        });
      }
    }

    const postId = await createPost({ userId, content: content.trim() });

    if (!postId) {
      throw new AppError(500, "Failed to create post", {
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        success: false,
      });
    }
    if (files && Array.isArray(files) && files.length > 0) {
      // Upload images to S3 and collect URLs
      const uploadPromises = files.map((file) => uploadToS3(file, "posts"));
      const fileUrls = await Promise.all(uploadPromises);

      const assets: Array<{
        postId: string;
        url: string;
        mimetype: string;
        size: number;
        userId: string;
      }> = fileUrls.map((url, index) => ({
        postId,
        url,
        mimetype: files[index].mimetype,
        size: files[index].size,
        userId,
      }));
      await createPostAssets(assets);
    }

    return sendSuccess(res, {
      status: 201,
      message: "Post created successfully",
      postId,
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    logger.error("Error in createPostController", { error: err });
    next(err);
  }
};

export const editPostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    const decoded = decodeToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const userId = decoded.userId as string;
    const postId = req.params.postId as string;
    const { content, deleteFilesIds: rawDeleteFilesIds } = req.body;

    // Parse deleteFilesIds from form data (comes as string)
    let deleteFilesIds: string[] | undefined;
    if (rawDeleteFilesIds) {
      try {
        deleteFilesIds =
          typeof rawDeleteFilesIds === "string"
            ? JSON.parse(rawDeleteFilesIds)
            : rawDeleteFilesIds;
      } catch (e) {
        throw new AppError(400, "deleteFilesIds must be a valid JSON array", {
          code: RESPONSE_CODES.BAD_REQUEST,
          success: false,
        });
      }
    }

    if (!postId) {
      throw new AppError(400, "Post ID is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      throw new AppError(
        400,
        "Content is required and must be a non-empty string",
        {
          code: RESPONSE_CODES.BAD_REQUEST,
          success: false,
        },
      );
    }

    if (content.length > 200) {
      throw new AppError(400, "Content must not exceed 200 characters", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    // Validate deleteFilesIds if provided
    if (
      deleteFilesIds &&
      (!Array.isArray(deleteFilesIds) ||
        !deleteFilesIds.every((id) => typeof id === "string"))
    ) {
      throw new AppError(400, "deleteFilesIds must be an array of strings", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }
    const files = req.files as Express.Multer.File[];
    let newAssets:
      | Array<{
        postId: string;
        url: string;
        mimetype: string;
        size: number;
        userId: string;
      }>
      | undefined;

    if (files && Array.isArray(files) && files.length > 0) {
      // Upload images to S3 and collect URLs
      const uploadPromises = files.map((file) => uploadToS3(file, "posts"));
      const fileUrls = await Promise.all(uploadPromises);

      newAssets = fileUrls.map((url, index) => ({
        postId,
        url,
        mimetype: files[index].mimetype,
        size: files[index].size,
        userId,
      }));
    }

    const success = await editPost(
      {
        postId,
        userId,
        content: content.trim(),
        deleteFilesIds: deleteFilesIds || [],
      },
      newAssets,
    );

    if (!success) {
      throw new AppError(
        404,
        "Post not found or you don't have permission to edit it",
        {
          code: RESPONSE_CODES.BAD_REQUEST,
          success: false,
        },
      );
    }

    return sendSuccess(res, {
      status: 200,
      message: "Post updated successfully",
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    logger.error("Error in editPostController", { error: err });
    next(err);
  }
};
export const deletePostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    const decoded = decodeToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const userId = decoded.userId as string;
    const postId = req.params.postId as string;

    if (!postId) {
      throw new AppError(400, "Post ID is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    const success = await deletePost({ postId, userId });

    if (!success) {
      throw new AppError(
        404,
        "Post not found or you don't have permission to delete it",
        {
          code: RESPONSE_CODES.BAD_REQUEST,
          success: false,
        },
      );
    }

    return sendSuccess(res, {
      status: 200,
      message: "Post deleted successfully",
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    logger.error("Error in deletePostController", { error: err });
    next(err);
  }
};

export const getPostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const postId = req.params.postId as string;
    if (!postId) {
      throw new AppError(400, "Post ID is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }
    const token = extractBearerToken(req.headers.authorization);

    const decoded = decodeToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const userId = decoded.userId as string;

    const post = await getPost(postId, userId);

    if (!post) {
      throw new AppError(404, "Post not found", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    return sendSuccess(res, {
      status: 200,
      message: "Post retrieved successfully",
      post,
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    logger.error("Error in getPostController", { error: err });
    next(err);
  }
};

export const getPostsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const city = req.query.city as string;
    const token = extractBearerToken(req.headers.authorization);

    const decoded = decodeToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const userId = decoded.userId as string;

    if (limit < 1 || limit > 100) {
      throw new AppError(400, "Limit must be between 1 and 100", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    if (offset < 0) {
      throw new AppError(400, "Offset must be non-negative", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    const postsResponse = await getPosts(userId, limit, offset, city);

    return sendSuccess(res, {
      status: 200,
      message: "Posts retrieved successfully",
      ...postsResponse,
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    logger.error("Error in getPostsController", { error: err });
    next(err);
  }
};

export const searchPostsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const searchQuery = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const token = extractBearerToken(req.headers.authorization);

    const decoded = decodeToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const userId = decoded.userId as string;

    if (!searchQuery || searchQuery.trim().length === 0) {
      throw new AppError(
        400,
        "Search query parameter 'q' is required and cannot be empty",
        {
          code: RESPONSE_CODES.BAD_REQUEST,
          success: false,
        },
      );
    }

    if (limit < 1 || limit > 100) {
      throw new AppError(400, "Limit must be between 1 and 100", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    if (offset < 0) {
      throw new AppError(400, "Offset must be non-negative", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    const postsResponse = await searchPosts(
      searchQuery.trim(),
      userId,
      limit,
      offset,
    );

    return sendSuccess(res, {
      status: 200,
      message: "Posts search completed successfully",
      ...postsResponse,
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    logger.error("Error in searchPostsController", { error: err });
    next(err);
  }
};

export const getPostCommentsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const postId = req.params.postId as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!postId) {
      throw new AppError(400, "Post ID is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    if (limit < 1 || limit > 100) {
      throw new AppError(400, "Limit must be between 1 and 100", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    if (offset < 0) {
      throw new AppError(400, "Offset must be non-negative", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    const commentsResponse = await getPostComments(postId, limit, offset);

    return sendSuccess(res, {
      status: 200,
      message: "Post comments retrieved successfully",
      ...commentsResponse,
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    logger.error("Error in getPostCommentsController", { error: err });
    next(err);
  }
};

export const createPostCommentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    const decoded = decodeToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const userId = decoded.userId as string;
    const postId = req.params.postId as string;
    const { comment } = req.body;

    if (!postId) {
      throw new AppError(400, "Post ID is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    if (
      !comment ||
      typeof comment !== "string" ||
      comment.trim().length === 0
    ) {
      throw new AppError(
        400,
        "Comment is required and must be a non-empty string",
        {
          code: RESPONSE_CODES.BAD_REQUEST,
          success: false,
        },
      );
    }

    if (comment.length > 150) {
      throw new AppError(400, "Comment must not exceed 150 characters", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    const commentId = await createPostComment({
      userId,
      postId,
      comment: comment.trim(),
    });

    if (!commentId) {
      throw new AppError(500, "Failed to create comment", {
        code: RESPONSE_CODES.INTERNAL_SERVER_ERROR,
        success: false,
      });
    }

    return sendSuccess(res, {
      status: 201,
      message: "Comment created successfully",
      commentId,
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    logger.error("Error in createPostCommentController", { error: err });
    next(err);
  }
};

export const togglePostLikeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    const decoded = decodeToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const userId = decoded.userId as string;
    const postId = req.params.postId as string;

    if (!postId) {
      throw new AppError(400, "Post ID is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    const isLiked = await togglePostLike(userId, postId);

    return sendSuccess(res, {
      status: 200,
      message: isLiked ? "Post liked" : "Post unliked",
      isLiked,
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    logger.error("Error in togglePostLikeController", { error: err });
    next(err);
  }
};

export const blockPostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const decoded = decodeToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const userId = decoded.userId as string;
    const postId = req.params.postId as string;

    if (!postId) {
      throw new AppError(400, "Post ID is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    const success = await blockPost(userId, postId);

    return sendSuccess(res, {
      status: 200,
      message: "Post blocked successfully",
      success,
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    logger.error("Error in blockPostController", { error: err });
    next(err);
  }
};

export const reportPostController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const decoded = decodeToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const userId = decoded.userId as string;
    const postId = req.params.postId as string;
    const { comment } = req.body;

    if (!postId) {
      throw new AppError(400, "Post ID is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
      throw new AppError(400, "Comment is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    const success = await reportPost({
      userId,
      postId,
      comment: comment.trim(),
    });

    return sendSuccess(res, {
      status: 200,
      message: "Post reported successfully",
      success,
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    logger.error("Error in reportPostController", { error: err });
    next(err);
  }
};

export const reportCommentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const decoded = decodeToken(token);

    if (!decoded || !decoded.userId) {
      throw new AppError(401, RESPONSE_MESSAGES[RESPONSE_CODES.UNAUTHORIZED], {
        code: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
      });
    }

    const userId = decoded.userId as string;
    const commentId = req.params.commentId as string;
    const { reason } = req.body;

    if (!commentId) {
      throw new AppError(400, "Comment ID is required", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      throw new AppError(400, "Reason is required and must be a non-empty string", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    const success = await reportComment({
      userId,
      commentId,
      reason: reason.trim(),
    });

    return sendSuccess(res, {
      status: 200,
      message: "Comment reported successfully",
      success,
      code: RESPONSE_CODES.SUCCESS,
    });
  } catch (err) {
    logger.error("Error in reportCommentController", { error: err });
    next(err);
  }
};
