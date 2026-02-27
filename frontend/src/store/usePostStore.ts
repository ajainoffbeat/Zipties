import { create } from "zustand";
import { createPost as createPostApi, getPosts as getPostsApi, getPost as getPostApi, deletePost as deletePostApi, editPost as editPostApi, togglePostLike as togglePostLikeApi, getPostComments as getPostCommentsApi, createPostComment as createPostCommentApi, searchPosts as searchPostsApi, blockPost as blockPostApi, reportPost as reportPostApi } from "@/lib/api/post.api";

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
    searchQuery: string;
    isSearching: boolean;
    searchResults: Post[];
    searchPagination: Pagination;
    selectedCity: string;

    fetchPosts: (reset?: boolean) => Promise<void>;
    setSelectedCity: (city: string) => void;
    searchPosts: (query: string, reset?: boolean) => Promise<void>;
    clearSearch: () => void;
    getPost: (postId: string) => Promise<Post>;
    createPost: (content: string, imageFiles: File[]) => Promise<void>;
    editPost: (postId: string, content: string, imageFiles: File[], removedImageIds?: string[]) => Promise<void>;
    deletePost: (postId: string) => Promise<void>;
    toggleLike: (postId: string) => Promise<void>;
    blockPost: (postId: string) => Promise<void>;
    reportPost: (postId: string, comment: string) => Promise<void>;
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
    searchQuery: "",
    isSearching: false,
    searchResults: [],
    searchPagination: { limit: 20, offset: 0, hasMore: true },
    selectedCity: "",

    clearError: () => set({ error: null }),

    setSelectedCity: (city: string) => {
        set({ selectedCity: city });
        get().fetchPosts(true);
    },

    toggleLike: async (postId) => {
        const currentPost = get().posts.find(p => p.postId === postId);
        if (!currentPost) return;

        const originalIsLiked = currentPost.isLiked;
        const originalLikes = currentPost.likes;

        // Optimistic update
        set((state) => ({
            posts: state.posts.map((p) => {
                if (p.postId !== postId) return p;
                const newIsLiked = !p.isLiked;
                const newLikes = newIsLiked ? p.likes + 1 : Math.max(0, p.likes - 1);
                return { ...p, isLiked: newIsLiked, likes: newLikes };
            }),
        }));




        try {
            const response = await togglePostLikeApi(postId);

            set((state) => ({
                posts: state.posts.map((p) => {
                    if (p.postId !== postId) return p;

                    const isLiked = response.isLiked;

                    return {
                        ...p,
                        isLiked,
                        likes: isLiked
                            ? p.likes + (p.isLiked ? 0 : 1)
                            : p.likes - (p.isLiked ? 1 : 0),
                    };
                }),
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


    blockPost: async (postId: string) => {
        try {
            await blockPostApi(postId);
            set((state) => ({
                posts: state.posts.filter((p) => p.postId !== postId),
            }));
            // toast.success("Post blocked successfully"); // Toast handled by caller or global handler if needed
        } catch (error) {
            console.error("Error blocking post:", error);
            // toast.error("Failed to block post");
        }
    },

    reportPost: async (postId: string, comment: string) => {
        try {
            await reportPostApi(postId, comment);
            // toast.success("Post reported successfully");
        } catch (error) {
            console.error("Error reporting post:", error);
            // toast.error("Failed to report post");
        }
    },

    fetchPosts: async (reset = false) => {
        const { pagination, isLoading, selectedCity } = get();
        if (isLoading) return;
        if (!reset && !pagination.hasMore) return;

        const offset = reset ? 0 : pagination.offset;
        set({ isLoading: true, error: null });

        try {
            const data = await getPostsApi(pagination.limit, offset, selectedCity || undefined);
            // data shape: { success, message, posts, pagination, code }
            const incoming: Post[] = (data.posts ?? []).map((p: any) => ({
                ...p,
                likes: p.likeCount || 0,
                comments: p.commentCount || 0,
                shares: 0,
                isLiked: p.isLiked || false,
            }));

            set((state) => ({
                posts: reset ? incoming : [...state.posts, ...incoming.filter(p => !state.posts.some(x => x.postId === p.postId))],
                pagination: {
                    ...state.pagination,
                    offset: reset ? incoming.length : state.pagination.offset + incoming.length,
                    hasMore: incoming.length === state.pagination.limit, // keep based on backend page size
                },
                isLoading: false,
            }));
        } catch (err: any) {
            set({
                isLoading: false,
                error: err?.response?.data?.message ?? "Failed to load posts",
            });
        }
    },

    searchPosts: async (query, reset = false) => {
        const { searchPagination, isSearching } = get();
        if (isSearching) return;
        if (!reset && !searchPagination.hasMore) return;

        const offset = reset ? 0 : searchPagination.offset;
        set({ isSearching: true, searchQuery: query, error: null });

        try {
            const data = await searchPostsApi(query, searchPagination.limit, offset);
            const incoming: Post[] = (data.posts ?? []).map((p: any) => ({
                ...p,
                likes: p.likeCount || 0,
                comments: p.commentCount || 0,
                shares: 0,
                isLiked: p.isLiked || false,
            }));

            set((state) => ({
                searchResults: reset ? incoming : [...state.searchResults, ...incoming],
                searchPagination: data.pagination ?? state.searchPagination,
                isSearching: false,
            }));
        } catch (err: any) {
            set({
                isSearching: false,
                error: err?.response?.data?.message ?? "Failed to search posts",
            });
        }
    },

    clearSearch: () => set({
        searchQuery: "",
        searchResults: [],
        searchPagination: { limit: 20, offset: 0, hasMore: true },
        isSearching: false,
    }),

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
