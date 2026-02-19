import { create } from "zustand";
import { createPost as createPostApi, getPosts as getPostsApi, getPost as getPostApi, deletePost as deletePostApi, editPost as editPostApi, togglePostLike as togglePostLikeApi, getPostComments as getPostCommentsApi, createPostComment as createPostCommentApi } from "@/lib/api/post.api";

/* ── Types mirroring the backend PostResponse ── */
export interface PostAsset {
    id: string;
    url: string;
    mimetype: string;
    fileSizeBytes: number;
    position: number;
}

export interface PostUser {
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
}

export interface Post {
    postId: string;
    content: string;
    isBlocked: boolean;
    createdAt: string;
    updatedAt: string | null;
    user: PostUser;
    assets: PostAsset[];
    // client-only fields
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
}

interface Pagination {
    limit: number;
    offset: number;
    hasMore: boolean;
}

interface PostState {
    posts: Post[];
    pagination: Pagination;
    isLoading: boolean;
    isCreating: boolean;
    error: string | null;

    fetchPosts: (reset?: boolean) => Promise<void>;
    getPost: (postId: string) => Promise<Post>;
    createPost: (content: string, imageFiles: File[]) => Promise<void>;
    editPost: (postId: string, content: string, imageFiles: File[], removedImageIds?: string[]) => Promise<void>;
    deletePost: (postId: string) => Promise<void>;
    toggleLike: (postId: string) => Promise<void>;
    getPostComments: (postId: string, limit?: number, offset?: number) => Promise<any>;
    createComment: (postId: string, comment: string) => Promise<void>;
    clearError: () => void;
}

export const usePostStore = create<PostState>((set, get) => ({
    posts: [],
    pagination: { limit: 20, offset: 0, hasMore: true },
    isLoading: false,
    isCreating: false,
    error: null,

    clearError: () => set({ error: null }),

    toggleLike: async (postId) => {
        const currentPost = get().posts.find(p => p.postId === postId);
        if (!currentPost) return;

        // Optimistic update
        const originalIsLiked = currentPost.isLiked;
        const originalLikes = currentPost.likes;
        
        set((state) => ({
            posts: state.posts.map((p) =>
                p.postId === postId
                    ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                    : p
            ),
        }));

        try {
            const response = await togglePostLikeApi(postId);
            // Use the actual isLiked from backend response
            set((state) => ({
                posts: state.posts.map((p) =>
                    p.postId === postId
                        ? { ...p, isLiked: response.isLiked, likes: response.isLiked ? originalLikes + 1 : originalLikes - 1 }
                        : p
                ),
            }));
        } catch (err: any) {
            // Revert optimistic update on error
            set((state) => ({
                posts: state.posts.map((p) =>
                    p.postId === postId
                        ? { ...p, isLiked: originalIsLiked, likes: originalLikes }
                        : p
                ),
                error: err?.response?.data?.message ?? "Failed to toggle like",
            }));
        }
    },

    fetchPosts: async (reset = false) => {
        const { pagination, isLoading } = get();
        if (isLoading) return;
        if (!reset && !pagination.hasMore) return;

        const offset = reset ? 0 : pagination.offset;
        set({ isLoading: true, error: null });

        try {
            const data = await getPostsApi(pagination.limit, offset);
            // data shape: { success, message, posts, pagination, code }
            const incoming: Post[] = (data.posts ?? []).map((p: any) => ({
                ...p,
                likes: p.likeCount || 0,
                comments: p.commentCount || 0,
                shares: 0,
                isLiked: p.isLiked || false,
            }));

            set((state) => ({
                posts: reset ? incoming : [...state.posts, ...incoming],
                pagination: data.pagination ?? state.pagination,
                isLoading: false,
            }));
        } catch (err: any) {
            set({
                isLoading: false,
                error: err?.response?.data?.message ?? "Failed to load posts",
            });
        }
    },

    getPost: async (postId) => {
        try {
            const data = await getPostApi(postId);
            return {
                ...data,
                likes: data.likeCount || 0,
                comments: data.commentCount || 0,
                shares: 0,
                isLiked: data.isLiked || false,
            };
        } catch (err: any) {
            throw err;
        }
    },

    createPost: async (content, imageFiles) => {
        set({ isCreating: true, error: null });
        try {
            await createPostApi(content, imageFiles);
            // Refresh feed from the top after creating
            await get().fetchPosts(true);
            set({ isCreating: false });
        } catch (err: any) {
            set({
                isCreating: false,
                error: err?.response?.data?.message ?? "Failed to create post",
            });
            throw err; // re-throw so Feed can catch it if needed
        }
    },

    editPost: async (postId, content, imageFiles, removedImageIds = []) => {
        try {
            const response = await editPostApi(postId, content, imageFiles, removedImageIds);
            
            // Update post in local state with the response data
            set((state) => ({
                posts: state.posts.map((p) =>
                    p.postId === postId
                        ? { 
                            ...p, 
                            content, 
                            updatedAt: new Date().toISOString(),
                            // Update assets with the response from API
                            assets: response.assets || p.assets
                        }
                        : p
                ),
            }));
        } catch (err: any) {
            set({
                error: err?.response?.data?.message ?? "Failed to update post",
            });
            throw err;
        }
    },

    deletePost: async (postId) => {
        try {
            await deletePostApi(postId);
            // Optimistically remove from local state
            set((state) => ({
                posts: state.posts.filter((p) => p.postId !== postId),
            }));
        } catch (err: any) {
            set({
                error: err?.response?.data?.message ?? "Failed to delete post",
            });
            throw err;
        }
    },

    getPostComments: async (postId, limit = 20, offset = 0) => {
        try {
            const data = await getPostCommentsApi(postId, limit, offset);
            return data;
        } catch (err: any) {
            set({
                error: err?.response?.data?.message ?? "Failed to get comments",
            });
            throw err;
        }
    },

    createComment: async (postId, comment) => {
        // Optimistic update
        set((state) => ({
            posts: state.posts.map((p) =>
                p.postId === postId
                    ? { ...p, comments: p.comments + 1 }
                    : p
            ),
        }));

        try {
            await createPostCommentApi(postId, comment);
        } catch (err: any) {
            // Revert optimistic update on error
            set((state) => ({
                posts: state.posts.map((p) =>
                    p.postId === postId
                        ? { ...p, comments: p.comments - 1 }
                        : p
                ),
                error: err?.response?.data?.message ?? "Failed to create comment",
            }));
            throw err;
        }
    },
}));
