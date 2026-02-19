import { api } from "./client";

/** Create a new post (multipart/form-data so images can be attached) */
export const createPost = async (content: string, imageFiles: File[]) => {
    const formData = new FormData();
    formData.append("content", content);
    imageFiles.forEach((file) => formData.append("images", file));
    const res = await api.post("/posts/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};

/** Fetch paginated posts for the feed */
export const getPosts = async (limit = 20, offset = 0) => {
    const res = await api.get("/posts", { params: { limit, offset } });
    return res.data;
};

/** Fetch a single post by ID */
export const getPost = async (postId: string) => {
    const res = await api.get(`/posts/get/${postId}`);
    return res.data;
};

/** Delete a post */
export const deletePost = async (postId: string) => {
    const res = await api.delete(`/posts/delete/${postId}`);
    return res.data;
};

/** Update a post */
export const editPost = async (postId: string, content: string, imageFiles: File[] = [], removedImageIds: string[] = []) => {
    const formData = new FormData();
    formData.append("content", content);
    imageFiles.forEach((file) => formData.append("images", file));
    removedImageIds.forEach((id) => formData.append("deleteFilesIds[]", id));
    
    const res = await api.put(`/posts/edit/${postId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};

/** Toggle like on a post */
export const togglePostLike = async (postId: string) => {
    const res = await api.post(`/posts/like/${postId}`);
    return res.data;
};

/** Get comments for a post */
export const getPostComments = async (postId: string, limit = 20, offset = 0) => {
    const res = await api.get(`/posts/comments/${postId}`, { params: { limit, offset } });
    return res.data;
};

/** Create a comment on a post */
export const createPostComment = async (postId: string, comment: string) => {
    const res = await api.post(`/posts/comment/${postId}`, { comment });
    return res.data;
};

/** Search posts by content */
export const searchPosts = async (searchQuery: string, limit = 20, offset = 0) => {
    const res = await api.get("/posts/search", { params: { q: searchQuery, limit, offset } });
    return res.data;
};
