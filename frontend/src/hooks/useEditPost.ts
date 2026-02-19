// pages/posts/edit/useEditPost.ts
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePostStore } from "@/store/usePostStore";

export function useEditPost(postId?: string) {
  const navigate = useNavigate();
  const { posts, getPost, editPost, fetchPosts } = usePostStore();

  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) {
      navigate("/feed");
      return;
    }

    const existing = posts.find(p => p.postId === postId);
    if (existing) {
      setContent(existing.content);
    } else {
      loadPost();
    }
  }, [postId, posts]);

  const loadPost = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const post = await getPost(postId);
      setContent(post.content);
    } catch {
      setError("Failed to load post.");
      setTimeout(() => navigate("/feed"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (files: File[], removedImageIds?: string[]) => {
    const trimmed = content.trim();

    if (!trimmed) {
      setError("Please add some text.");
      return;
    }

    if (trimmed.length > 200) {
      setError("Post content must not exceed 200 characters.");
      return;
    }

    if (!postId) return;

    try {
      setLoading(true);
      await editPost(postId, trimmed, files, removedImageIds);
      
      // Refresh feed data to get the latest updates
      await fetchPosts(true);
      
      navigate("/feed");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to update post.");
    } finally {
      setLoading(false);
    }
  };

  return {
    content,
    setContent,
    error,
    setError,
    loading,
    submit,
  };
}
