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
  }, []);

  if (isLoading && posts.length === 0) {
    return (
      <>
        <PostSkeleton />
        <PostSkeleton />
      </>
    );
  }

  return (
    <>
      {posts.map((post) => (
        <FeedPost key={post.postId} post={post} />
      ))}
    </>
  );
}
