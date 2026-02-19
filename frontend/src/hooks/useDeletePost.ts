import { useState } from "react";
import { usePostStore } from "@/store/usePostStore";

export function useDeletePost() {
  const { deletePost } = usePostStore();
  const [postId, setPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      await deletePost(postId);
      setPostId(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    postId,
    setPostId,
    confirm,
    loading,
  };
}
