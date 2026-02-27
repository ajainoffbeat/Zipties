import { Virtuoso } from "react-virtuoso";
import { usePostStore } from "@/store/usePostStore";
import FeedPost from "./FeedPost";
import PostSkeleton from "@/components/skeletons/PostSkeleton";
import { useEffect } from "react";

export default function FeedList() {
  const {
    posts,
    fetchPosts,
    isLoading,
    pagination,
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
