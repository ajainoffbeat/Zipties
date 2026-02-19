import { api } from "./client";

/** Create a new post (multipart/form-data so images can be attached) */
export const createPost = async (content: string, imageFiles: File[]) => {
    const formData = new FormData();
    formData.append("content", content);
    imageFiles.forEach((file) => formData.append("images", file));
    console.log("Form DATA", formData)
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
export const editPost = async (postId: string, content: string, imageFiles: File[] = []) => {
    const formData = new FormData();
    formData.append("content", content);
    imageFiles.forEach((file) => formData.append("images", file));
    
    const res = await api.put(`/posts/edit/${postId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};
