import type { CreatePostRequest, EditPostRequest, UpdatePostRequest, PostAssetData, PostResponse, PostsResponse } from "../@types/post.types.js";
import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/response/appError.js";
import { RESPONSE_CODES } from "../constants/responseCode.constant.js";

export const createPost = async (postData: CreatePostRequest): Promise<string | null> => {
  try {
    logger.debug('Creating new post', { userId: postData.userId });

    const result = await pool.query(
      "SELECT fn_create_post($1, $2) AS post_id",
      [postData.userId, postData.content]
    );

    const postId = result.rows[0]?.post_id;
    if (postId) {
      logger.info('Post created successfully', {
        postId,
        userId: postData.userId
      });
    }

    return postId || null;
  } catch (error) {
    logger.error('Failed to create post', {
      userId: postData.userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

export const editPost = async (postData: EditPostRequest, newAssets?: PostAssetData[]): Promise<boolean> => {
  try {
    logger.debug('Editing post', {
      postId: postData.postId,
      userId: postData.userId
    });

    // Handle asset deletions first
    if (postData.deleteFilesIds && postData.deleteFilesIds.length > 0) {
      const deactivateResult = await pool.query(
        'SELECT fn_deactivate_post_assets($1, $2, $3) as deactivated_count',
        [postData.userId, postData.deleteFilesIds, postData.postId]
      );
      const deactivatedCount = parseInt(deactivateResult.rows[0].deactivated_count);
      logger.info('Assets deactivated', {
        postId: postData.postId,
        deletedCount: deactivatedCount
      });
    }

    // Check current active assets count
    const currentAssetsResult = await pool.query(
      'SELECT fn_get_active_post_assets_count($1) as count',
      [postData.postId]
    );
    const currentCount = parseInt(currentAssetsResult.rows[0].count);
    const newAssetsCount = newAssets ? newAssets.length : 0;
    const totalAssets = currentCount + newAssetsCount;

    if (totalAssets > 5) {
      throw new AppError(400, `Cannot add ${newAssetsCount} new images. Post would have ${totalAssets} images, but maximum is 5.`, {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    // Add new assets if provided
    if (newAssets && newAssets.length > 0) {
      await createPostAssets(newAssets);
    }

    // Renumber positions to ensure they're sequential and unique
    const renumberResult = await pool.query(
      'SELECT fn_renumber_post_asset_positions($1, $2) as updated_count',
      [postData.postId, postData.userId]
    );
    const updatedCount = parseInt(renumberResult.rows[0].updated_count);

    logger.info('Positions renumbered for post', { postId: postData.postId, updatedCount });

    // Update post content
    const result = await pool.query(
      "SELECT fn_edit_post($1, $2, $3) AS success",
      [postData.postId, postData.userId, postData.content]
    );

    const success = result.rows[0]?.success === true;
    if (success) {
      logger.info('Post edited successfully', {
        postId: postData.postId,
        userId: postData.userId
      });
    } else {
      logger.warn('Failed to edit post - post not found or access denied', {
        postId: postData.postId,
        userId: postData.userId
      });
    }

    return success;
  } catch (error) {
    logger.error('Failed to edit post', {
      postId: postData.postId,
      userId: postData.userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};
export const deletePost = async (postData: { postId: string; userId: string }): Promise<boolean> => {
  try {
    logger.debug('Deleting post', {
      postId: postData.postId,
      userId: postData.userId
    });

    const result = await pool.query(
      "SELECT fn_delete_post($1, $2) AS success",
      [postData.postId, postData.userId]
    );

    const success = result.rows[0]?.success === true;
    if (success) {
      logger.info('Post deleted successfully', {
        postId: postData.postId,
        userId: postData.userId
      });
    } else {
      logger.warn('Failed to delete post - post not found or access denied', {
        postId: postData.postId,
        userId: postData.userId
      });
    }

    return success;
  } catch (error) {
    logger.error('Failed to delete post', {
      postId: postData.postId,
      userId: postData.userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};



export const createPostAssets = async (assets: PostAssetData[]): Promise<void> => {
  try {
    if (assets.length === 0) return;

    const postId = assets[0].postId;
    logger.debug('Creating post assets', { count: assets.length, postId });

    // Get current maximum position for this post
    const maxPositionResult = await pool.query(
      'SELECT fn_get_max_post_asset_position($1) as max_position',
      [postId]
    );
    const maxPosition = parseInt(maxPositionResult.rows[0].max_position);

    // Prepare assets data as JSONB array for the function
    const assetsData = assets.map((asset, index) => ({
      post_id: asset.postId,
      url: `http://localhost:5000/posts/${asset.filename}`,
      mimetype: asset.mimetype,
      file_size_bytes: asset.size,
      position: maxPosition + index + 1,
      created_by: asset.userId,
      updated_by: asset.userId
    }));

    // Insert all assets using the PostgreSQL function
    const insertResult = await pool.query(
      'SELECT fn_insert_post_assets($1) as inserted_count',
      [JSON.stringify(assetsData)]
    );

    const insertedCount = parseInt(insertResult.rows[0].inserted_count);
    logger.info('Post assets created successfully', { count: insertedCount, postId });
  } catch (error) {
    logger.error('Failed to create post assets', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

export const getPost = async (postId: string): Promise<PostResponse | null> => {
try {
    logger.debug('Getting post', { postId });
    const result = await pool.query(
      "SELECT * FROM fn_get_post($1)",
      [postId]
    );
    console.log("postId in getPost11", result.rows[0]);

    const post = result.rows[0];
    if (!post) {
      logger.debug('Post not found or blocked', { postId });
      return null;
    }

    const postResponse: PostResponse = {
      postId: post.post_id,
      content: post.content,
      isBlocked: post.is_blocked === '1',
      createdAt: post.created_at.toISOString(),
      updatedAt: post.updated_at ? post.updated_at.toISOString() : null,
      user: {
        userId: post.user_id,
        firstName: post.user_firstname || '',
        lastName: post.user_lastname || '',
        username: post.user_username || ''
      },
      assets: post.assets || []
    };

    logger.debug('Post retrieved successfully', { postId });
    return postResponse;
  } catch (error) {
    logger.error('Failed to get post', {
      postId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};



export const getPosts = async (limit: number = 20, offset: number = 0): Promise<PostsResponse> => {
  try {
    logger.debug('Getting posts', { limit, offset });

    const result = await pool.query(
      "SELECT * FROM fn_get_posts($1, $2)",
      [limit, offset]
    );

    const posts: PostResponse[] = result.rows.map(post => ({
      postId: post.post_id,
      content: post.content,
      isBlocked: false, // Already filtered
      createdAt: post.created_at.toISOString(),
      updatedAt: null, // Not returned in fn_get_posts
      user: {
        userId: post.user_id,
        firstName: post.user_firstname || '',
        lastName: post.user_lastname || '',
        username: post.user_username || ''
      },
      assets: post.assets || []
    }));

    const hasMore = posts.length === limit;

    const response: PostsResponse = {
      posts,
      pagination: {
        limit,
        offset,
        hasMore
      }
    };

    logger.debug('Posts retrieved successfully', { count: posts.length, limit, offset });
    return response;
  } catch (error) {
    logger.error('Failed to get posts', {
      limit,
      offset,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

export const searchPosts = async (searchQuery: string, limit: number = 20, offset: number = 0): Promise<PostsResponse> => {
  try {
    logger.debug('Searching posts', { searchQuery, limit, offset });

    if (!searchQuery || searchQuery.trim().length === 0) {
      throw new AppError(400, "Search query is required and cannot be empty", {
        code: RESPONSE_CODES.BAD_REQUEST,
        success: false,
      });
    }

    const result = await pool.query(
      "SELECT * FROM fn_search_posts($1, $2, $3)",
      [searchQuery.trim(), limit, offset]
    );

    const posts: PostResponse[] = result.rows.map(post => ({
      postId: post.post_id,
      content: post.content,
      isBlocked: false, // Already filtered
      createdAt: post.created_at.toISOString(),
      updatedAt: null, // Not returned in fn_search_posts
      user: {
        userId: post.user_id,
        firstName: post.user_firstname || '',
        lastName: post.user_lastname || '',
        username: post.user_username || ''
      },
      assets: post.assets || []
    }));

    const hasMore = posts.length === limit;

    const response: PostsResponse = {
      posts,
      pagination: {
        limit,
        offset,
        hasMore
      }
    };

    logger.debug('Posts search completed successfully', { count: posts.length, searchQuery, limit, offset });
    return response;
  } catch (error) {
    logger.error('Failed to search posts', {
      searchQuery,
      limit,
      offset,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};