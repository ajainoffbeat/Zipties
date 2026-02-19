import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import PostSkeleton from "@/components/skeletons/PostSkeleton";
import FeedPostCard from "./FeedPostCard";
import { usePostStore } from "@/store/usePostStore";

export default function FeedList() {
  const navigate = useNavigate();

  const {
    posts,
    isLoading,
    error,
    fetchPosts,
    toggleLike,
    clearError,
    deletePost,
    pagination,
  } = usePostStore();

  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // initial fetch
  useEffect(() => {
    fetchPosts(true);
  }, []);

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deletingPostId) return;
    setIsDeleting(true);
    try {
      await deletePost(deletingPostId);
      setDeletingPostId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── States ── */
  if (isLoading && posts.length === 0) {
    return (
      <>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </>
    );
  }

  if (!isLoading && posts.length === 0 && !error) {
    return (
      <div className="bg-card rounded-2xl border p-10 text-center">
        <p className="font-medium">No posts yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Be the first to share something!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Global error */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm mb-4">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={clearError} className="ml-auto">
            ✕
          </button>
        </div>
      )}

      {/* Posts */}
      {posts.map((post) => (
        <FeedPostCard
          key={post.postId}
          post={post}
          onLike={() => toggleLike(post.postId)}
        //   onEdit={() => navigate(`/edit-post/${post.postId}`)}
        //   onDelete={() => setDeletingPostId(post.postId)}
        />
      ))}

      {/* Load more */}
      {!isLoading && posts.length > 0 && (
        <div className="text-center pb-4">
          {pagination.hasMore ? (
            <Button
              variant="outline"
              onClick={() => fetchPosts()}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Load more"
              )}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              You're all caught up 🎉
            </p>
          )}
        </div>
      )}

      {/* Delete confirm (keep it local to list) */}
      {/* {deletingPostId && (
        <DeletePostDialog
          loading={isDeleting}
          onCancel={() => setDeletingPostId(null)}
          onConfirm={confirmDelete}
        />
      )} */}
    </>
  );
}
