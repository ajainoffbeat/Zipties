import { Virtuoso } from "react-virtuoso";
import { usePostStore } from "@/store/usePostStore";
import FeedPost from "../../pages/Feed/FeedPost";
import PostSkeleton from "@/components/skeletons/PostSkeleton";
import { useEffect } from "react";

export default function FeedList() {
  const {
    posts,
    fetchPosts,
    isLoading,
    pagination,
    selectedCity,
    error,
  } = usePostStore();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (isLoading && posts.length === 0) {
    return (
      <>
        <PostSkeleton />
        <PostSkeleton />
      </>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card rounded-xl border border-border/50 shadow-sm animate-in fade-in zoom-in duration-300">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No Posts Found</h3>
        <p className="text-muted-foreground max-w-xs">
          {selectedCity
            ? `It looks like there are no posts from ${selectedCity} yet.`
            : "There are no posts to show in your feed right now."}
        </p>
      </div>
    );
  }

  return (
    <Virtuoso
      useWindowScroll
      data={posts}
      itemContent={(index, post) => (
        <FeedPost key={post.postId} post={post} />
      )}
      endReached={() => {
        if (!isLoading && pagination.hasMore) {
          fetchPosts();
        }
      }}
    />
  );
}
