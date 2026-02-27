import { useState, useEffect } from "react";
import { usePostStore } from "@/store/usePostStore";

export function useInlineComments(postId: string, isOpen: boolean) {
  const { getPostComments, createComment } = usePostStore();

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadComments = async (reset = false) => {
    if (isLoading || (!hasMore && !reset)) return;

    setIsLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const data = await getPostComments(postId, 3, currentOffset);

      if (reset) {
        setComments(data.comments || []);
        setOffset(3);
      } else {
        setComments((prev) => [...prev, ...(data.comments || [])]);
        setOffset((prev) => prev + 3);
      }

      setHasMore(data.hasMore !== false);
    } finally {
      setIsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createComment(postId, newComment.trim());
      setNewComment("");
      await loadComments(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen && postId) {
      loadComments(true);
    }
  }, [isOpen, postId]);

  return {
    comments,
    newComment,
    setNewComment,
    isLoading,
    isSubmitting,
    hasMore,
    loadComments,
    submitComment,
  };
}