import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Image,
  Smile,
  Send,
  TrendingUp,
  Users,
  ImagePlus,
  AlertCircle,
  ImageIcon,
  Pencil,
  X,
  Loader2,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/store/useProfileStore";
import { usePostStore } from "@/store/usePostStore";


/* ─────────────────────────────────────────────
   PostImageGrid — smart layout for 1-N images
───────────────────────────────────────────── */
function PostImageGrid({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (images.length === 0) return null;

  const MAX_VISIBLE = 4;
  const visible = images.slice(0, MAX_VISIBLE);
  const overflow = images.length - MAX_VISIBLE;

  const gridClass =
    images.length === 1
      ? "grid-cols-1"
      : images.length === 2
        ? "grid-cols-2"
        : images.length === 3
          ? "grid-cols-3"
          : "grid-cols-2";

  return (
    <>
      <div className={cn("grid gap-0.5 bg-muted overflow-hidden", gridClass)}>
        {visible.map((src, i) => {
          const isLast = i === MAX_VISIBLE - 1 && overflow > 0;
          const spanFull = images.length === 3 && i === 0;

          return (
            <div
              key={i}
              className={cn(
                "relative overflow-hidden cursor-pointer group",
                spanFull && "row-span-2",
                images.length === 1 ? "aspect-[16/9]" : "aspect-square"
              )}
              onClick={() => setLightbox(i)}
            >
              <img
                src={src}
                alt={`Post image ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              {isLast && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="text-white text-2xl font-bold tracking-tight">
                    +{overflow + 1}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
            {lightbox + 1} / {images.length}
          </div>
          <img
            src={images[lightbox]}
            alt="Full view"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
            >
              ‹
            </button>
          )}
          {lightbox < images.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
            >
              ›
            </button>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((thumb, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
                  className={cn(
                    "w-10 h-10 rounded-md overflow-hidden border-2 transition-all",
                    i === lightbox ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-90"
                  )}
                >
                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   Post skeleton loader
───────────────────────────────────────────── */
function PostSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm animate-pulse space-y-4">
      <div className="flex gap-4">
        <div className="w-11 h-11 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-1/5" />
        </div>
        <div className="w-8 h-8 bg-muted rounded-xl" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
      <div className="h-52 bg-muted rounded-2xl" />
      <div className="flex gap-2 pt-2">
        <div className="h-8 bg-muted rounded-xl w-20" />
        <div className="h-8 bg-muted rounded-xl w-20" />
        <div className="h-8 bg-muted rounded-xl w-20" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Feed page
───────────────────────────────────────────── */
export default function Feed() {
  const { profile } = useProfileStore();
  const { posts, isLoading, isCreating, error, fetchPosts, createPost, deletePost, toggleLike, clearError } =
    usePostStore();
  const navigate = useNavigate();

  // Delete dialog state
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingPostId) return;
    setIsDeleting(true);
    try {
      await deletePost(deletingPostId);
      setDeletingPostId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Composer state
  const [newPost, setNewPost] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load posts on mount
  useEffect(() => {
    fetchPosts(true);
  }, []);

  /* ── Image helpers ── */
  const readFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      setSelectedFiles((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onload = (ev) =>
        setSelectedImages((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) readFiles(e.target.files);
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) readFiles(e.dataTransfer.files);
  };

  /* ── Submit post ── */
  const handlePost = async () => {
    const trimmed = newPost.trim();
    if (!trimmed && selectedFiles.length === 0) return;
    if (!trimmed) {
      setPostError("Please add some text to your post.");
      return;
    }
    if (trimmed.length > 200) {
      setPostError("Post content must not exceed 200 characters.");
      return;
    }

    setPostError(null);
    try {
      await createPost(trimmed, selectedFiles);
      setNewPost("");
      setSelectedImages([]);
      setSelectedFiles([]);
    } catch (err: any) {
      setPostError(err?.response?.data?.message ?? "Failed to create post. Please try again.");
    }
  };

  const charCount = newPost.length;
  const charLimit = 200;
  const isOverLimit = charCount > charLimit;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 mb-[18rem]">
        <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto">

          {/* ── Main Feed ── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Create Post */}
            <div
              className={cn(
                "bg-card rounded-2xl border shadow-sm overflow-hidden transition-colors duration-200",
                isDragging ? "border-primary/60 bg-primary/5" : "border-border"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="p-5">
                <div className="flex gap-4">
                  <Avatar className="w-11 h-11 shrink-0">
                    <AvatarImage src={profile?.profile_image_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {profile?.first_name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <textarea
                      placeholder="What's on your mind?"
                      value={newPost}
                      onChange={(e) => { setNewPost(e.target.value); setPostError(null); }}
                      className="w-full bg-transparent border-none resize-none focus:outline-none text-foreground placeholder:text-muted-foreground min-h-[60px] text-[15px] leading-relaxed"
                    />

                    {/* Image previews */}
                    {selectedImages.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {selectedImages.map((src, i) => (
                          <div
                            key={i}
                            className="relative group rounded-xl overflow-hidden border border-border shadow-sm"
                            style={{ width: selectedImages.length === 1 ? "100%" : "calc(50% - 4px)" }}
                          >
                            <img
                              src={src}
                              alt={`Preview ${i + 1}`}
                              className={cn("object-cover w-full", selectedImages.length === 1 ? "max-h-72" : "h-36")}
                            />
                            <button
                              onClick={() => handleRemoveImage(i)}
                              className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/85 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Drag hint */}
                    {isDragging && selectedImages.length === 0 && (
                      <div className="mt-3 border-2 border-dashed border-primary/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-primary/5">
                        <ImagePlus className="w-8 h-8 text-primary/60" />
                        <p className="text-sm text-muted-foreground">Drop images here</p>
                      </div>
                    )}

                    {/* Char counter + error */}
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {postError && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {postError}
                          </p>
                        )}
                      </div>
                      {charCount > 150 && (
                        <span className={cn("text-xs tabular-nums", isOverLimit ? "text-destructive font-semibold" : "text-muted-foreground")}>
                          {charCount}/{charLimit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions bar */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary/30">
                <div className="flex gap-1 items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCreating}
                  >
                    <ImageIcon className="w-4 h-4 mr-1.5" />
                    Photo
                    {selectedImages.length > 0 && (
                      <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {selectedImages.length}
                      </span>
                    )}
                  </Button>
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    disabled={isCreating}
                  >
                    <Smile className="w-4 h-4 mr-1.5" />
                    Emoji
                  </Button> */}
                </div>
                <Button
                  variant="hero"
                  size="sm"
                  disabled={(!newPost.trim() && selectedImages.length === 0) || isOverLimit || isCreating}
                  onClick={handlePost}
                  className="gap-1.5 min-w-[72px]"
                >
                  {isCreating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Global fetch error */}
            {error && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{error}</span>
                <button onClick={clearError} className="ml-auto hover:opacity-70 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Loading skeletons */}
            {isLoading && posts.length === 0 && (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            )}

            {/* Empty state */}
            {!isLoading && posts.length === 0 && !error && (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImagePlus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to share something with your community!</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Create First Post
                </Button>
              </div>
            )}

            {/* Posts */}
            {posts.map((post) => {
              const imageUrls = post.assets
                .sort((a, b) => a.position - b.position)
                .map((a) => a.url);
              const displayName =
                `${post.user.firstName} ${post.user.lastName}`.trim() || post.user.username;
              const initials =
                (post.user.firstName?.[0] ?? "") + (post.user.lastName?.[0] ?? "");

              return (
                <article
                  key={post.postId}
                  className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between p-5 pb-3">
                    <div className="flex gap-3">
                      <Avatar className="w-11 h-11 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {initials.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{displayName}</span>
                          <span className="text-muted-foreground text-sm">@{post.user.username}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    {post.user.userId === profile?.id ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 -mt-1 -mr-1">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => navigate(`/edit-post/${post.postId}`)}
                          >
                            <Pencil className="w-4 h-4" />
                            Edit post
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => setDeletingPostId(post.postId)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 -mt-1 -mr-1">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    )}
                  </div>

                  {/* Text */}
                  {post.content && (
                    <p className="text-foreground leading-relaxed px-5 pb-3 text-[15px]">
                      {post.content}
                    </p>
                  )}

                  {/* Images */}
                  <PostImageGrid images={imageUrls} />

                  {/* Actions */}
                  <div className="flex items-center gap-1 px-4 py-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(post.postId)}
                      className={cn(
                        "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors",
                        post.isLiked && "text-rose-500"
                      )}
                    >
                      <Heart className={cn("w-4 h-4 mr-1.5 transition-all", post.isLiked && "fill-current scale-110")} />
                      <span className="text-sm font-medium">{post.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                      <MessageCircle className="w-4 h-4 mr-1.5" />
                      <span className="text-sm font-medium">{post.comments}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                      <Share2 className="w-4 h-4 mr-1.5" />
                      <span className="text-sm font-medium">{post.shares}</span>
                    </Button>
                  </div>
                </article>
              );
            })}

            {/* ── Delete Confirm Dialog ── */}
            <Dialog open={!!deletingPostId} onOpenChange={(open) => !open && setDeletingPostId(null)}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Delete post?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. Your post and all its images will be permanently removed.
                </p>
                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" disabled={isDeleting}>Cancel</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={handleDeleteConfirm}
                    className="gap-2"
                  >
                    {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Load more */}
            {!isLoading && posts.length > 0 && (
              <div className="text-center pb-4">
                {usePostStore.getState().pagination?.hasMore ? (
                  <Button
                    variant="outline"
                    onClick={() => fetchPosts()}
                    className="gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load more"}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">You're all caught up! 🎉</p>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Trending */}
            {/* <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Trending Topics</h3>
              </div>
              <div className="space-y-1">
                {trendingTopics.map((topic, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors"
                  >
                    <span className="font-medium text-foreground">#{topic.tag}</span>
                    <span className="text-sm text-muted-foreground">{topic.posts} posts</span>
                  </button>
                ))}
              </div>
            </div> */}

            {/* Suggested People */}
            {/* <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Suggested People</h3>
              </div>
              <div className="space-y-3">
                {suggestedPeople.map((person, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {person.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground text-sm">{person.name}</p>
                        <p className="text-xs text-muted-foreground">{person.username}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Follow</Button>
                  </div>
                ))}
              </div>
            </div> */}
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
