import { memo, useMemo, useCallback, useState } from "react";
import { Heart, Loader2, MessageCircle, MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { usePostStore } from "@/store/usePostStore";
import PostMediaGrid from "@/components/media/PostMediaGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useDeletePost } from "@/hooks/useDeletePost";
import { useNavigate } from "react-router-dom";
import { useProfileStore } from "@/store/useProfileStore";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { InlineComments } from "@/components/comments/InlineComments";

function FeedPost({ post }) {
  const navigate = useNavigate();
  const toggleLike = usePostStore((s) => s.toggleLike);
  const [showComments, setShowComments] = useState(false);

  const imageUrls = useMemo(
    () =>
      [...post.assets]
        .sort((a, b) => a.position - b.position)
        .map((a) => a.url),
    [post.assets]
  );

  const handleLike = useCallback(
    () => toggleLike(post.postId),
    [toggleLike, post.postId]
  );

  const handleCommentClick = useCallback(() => {
    setShowComments(true);
  }, []);

  const deleteFlow = useDeletePost();
  const { profile } = useProfileStore();
  console.log(profile)
  const initials = (post.user.firstName?.[0] ?? "") + (post.user.lastName?.[0] ?? "");

  return (
    <article
      key={post.postId}
      className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="flex gap-3">
          <Avatar className="w-11 h-11 shrink-0">
            <AvatarImage src={`${profile.profile_image_url}`} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{post.user.username}</span>
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
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCommentClick}
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <MessageCircle className="w-4 h-4 mr-1.5" />
          <span className="text-sm font-medium">{post.comments}</span>
        </Button>
        {/* <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
          <Share2 className="w-4 h-4 mr-1.5" />
          <span className="text-sm font-medium">{post.shares}</span>
        </Button> */}

        <ConfirmDialog
          open={!!deleteFlow.postId}
          onOpenChange={() => deleteFlow.setPostId(null)}
          title="Delete post?"
          description="This action cannot be undone. Your post and all its images will be permanently removed."
          confirmText="Delete"
          confirmVariant="destructive"
          loading={deleteFlow.loading}
          onConfirm={deleteFlow.confirm}
        />

      </div>

      {/* Inline Comments Section */}
      <InlineComments
        postId={post.postId}
        commentCount={post.comments}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </article>
  );
}

export default memo(FeedPost);
