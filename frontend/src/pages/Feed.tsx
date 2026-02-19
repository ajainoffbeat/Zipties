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
  Send,
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
import PostMediaGrid from "@/components/media/PostMediaGrid";
import PostSkeleton from "@/components/skeletons/PostSkeleton";
import { useDeletePost } from "@/hooks/useDeletePost";
import { usePostComposer } from "@/hooks/usePostComposer";
import { useImageHandler } from "@/hooks/useImageHandler";

export default function Feed() {
  const { profile } = useProfileStore();
  const { posts, isLoading, error, fetchPosts, toggleLike, clearError } = usePostStore();
  const navigate = useNavigate();
  const deleteFlow = useDeletePost();
  const images = useImageHandler();
  const composer = usePostComposer(images.files);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load posts on mount
  useEffect(() => {
    fetchPosts(true);
  }, []);

  const charCount = composer.text.length;
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
                images.isDragging ? "border-primary/60 bg-primary/5" : "border-border"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                images.setIsDragging(true);
              }}
              onDragLeave={() => images.setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                images.setIsDragging(false);
                images.readFiles(e.dataTransfer.files);
              }}
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
                      value={composer.text}
                      onChange={(e) => { composer.setText(e.target.value) }}
                      className="w-full bg-transparent border-none resize-none focus:outline-none text-foreground placeholder:text-muted-foreground min-h-[60px] text-[15px] leading-relaxed"
                    />


                    {images.previews.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {images.previews.map((src, i) => (
                          <div
                            key={i}
                            className="relative group rounded-xl overflow-hidden border border-border shadow-sm"
                            style={{ width: images.previews.length === 1 ? "100%" : "calc(50% - 4px)" }}
                          >
                            <img
                              src={src}
                              alt={`Preview ${i + 1}`}
                              className={cn("object-cover w-full", images.previews.length === 1 ? "max-h-72" : "h-36")}
                            />
                            <button
                              onClick={() => images.remove(i)}
                              className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/85 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}


                    {images.isDragging && images.previews.length === 0 && (
                      <div className="mt-3 border-2 border-dashed border-primary/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-primary/5">
                        <ImagePlus className="w-8 h-8 text-primary/60" />
                        <p className="text-sm text-muted-foreground">Drop images here</p>
                      </div>
                    )}


                    <div className="flex items-center justify-between mt-2">
                      <div>
                        {composer.error && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {composer.error}
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


              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary/30">
                <div className="flex gap-1 items-center">
                  <input
                    ref={images.inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) images.readFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => images.inputRef.current?.click()}
                    disabled={composer.isCreating}
                  >
                    <ImageIcon className="w-4 h-4 mr-1.5" />
                    Photo
                    {images.previews.length > 0 && (
                      <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {images.previews.length}
                      </span>
                    )}
                  </Button>

                </div>
                <Button
                  variant="hero"
                  size="sm"
                  disabled={composer.isCreating}
                  onClick={() => composer.submit(images.reset)}
                  className="gap-1.5 min-w-[72px]"
                >
                  {composer.isCreating ? (
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

            {error && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{error}</span>
                <button onClick={clearError} className="ml-auto hover:opacity-70 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {isLoading && posts.length === 0 && (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            )}

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
                            onClick={() => deleteFlow.setPostId(post.postId)}
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
                  <PostMediaGrid images={imageUrls} />

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
            <Dialog open={!!deleteFlow.postId} onOpenChange={() => deleteFlow.setPostId(null)}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Delete post?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. Your post and all its images will be permanently removed.
                </p>
                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" disabled={deleteFlow.loading}>Cancel</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    disabled={deleteFlow.loading}
                    onClick={deleteFlow.confirm}
                    className="gap-2"
                  >
                    {deleteFlow.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
        </div>
      </div>
    </AppLayout>
  );
}
