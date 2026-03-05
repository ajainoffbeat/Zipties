import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { usePostStore } from "@/store/usePostStore";
import { useImageHandler } from "@/hooks/useImageHandler";
import EditPostForm from "./EditPostForm";
import { useEditPost } from "@/hooks/useEditPost";

export default function EditPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { posts } = usePostStore();

  const images = useImageHandler();
  const post = useEditPost(postId);
  // preload existing post images
  useEffect(() => {
    if (!postId) return;

    const existing = posts.find(p => p.postId === postId);
    if (existing) {
      const urls = [...existing.assets]
        .sort((a, b) => a.position - b.position)
        .map(a => a.url);
      const assetIds = [...existing.assets]
        .sort((a, b) => a.position - b.position)
        .map(a => a.id);

      images.setInitialPreviews(urls, assetIds);
    }
  }, [postId, posts]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <EditPostForm
          content={post.content}
          setContent={post.setContent}
          images={images.previews}
          isDragging={images.isDragging}
          setIsDragging={images.setIsDragging}
          onDrop={(files) => images.readFiles(files)}
          onRemoveImage={images.remove}
          inputRef={images.inputRef}
          onPickImage={() => images.inputRef.current?.click()}
          onCancel={() => navigate("/feed")}
          loading={post.loading}
          error={post.error}
          onSubmit={() => post.submit(images.files, images.removedAssetIds)}
        />
      </div>
    </AppLayout>
  );
}