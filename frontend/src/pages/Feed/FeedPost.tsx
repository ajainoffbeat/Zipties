
import { memo, useMemo, useCallback, useState } from "react";
import { Flag, Heart, MessageCircle, MoreHorizontal, Pencil, Trash2, User, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { usePostStore } from "@/store/usePostStore";
import PostMediaGrid from "@/components/media/PostMediaGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDeletePost } from "@/hooks/useDeletePost";
import { useNavigate } from "react-router-dom";
import { useProfileStore } from "@/store/useProfileStore";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { InlineComments } from "@/components/comments/InlineComments";
import { formatPostDate } from "@/lib/utils/formatTime";
import { ReportPostDialog } from "@/components/feed/ReportPostDialog";
import { toast } from "@/hooks/use-toast";
import { blockUser } from "@/lib/api/user.api";

function FeedPost({ post }) {

  const navigate = useNavigate();
  const toggleLike = usePostStore((s) => s.toggleLike);
  const blockPostAction = usePostStore((s) => s.blockPost);
  const reportPostAction = usePostStore((s) => s.reportPost);
  const [showComments, setShowComments] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const deleteFlow = useDeletePost();
  const { profile } = useProfileStore();
  const initials = (post.user.firstName?.[0] ?? "") + (post.user.lastName?.[0] ?? "");
  const isOwner = post.user.userId === profile?.id;


  const handleReport = async (reason: string) => {
    setIsReporting(true);
    try {
      await reportPostAction(post.postId, reason);
      toast({
        title: "Post reported successfully",
        description: "The post has been reported for review.",
      });
      setReportDialogOpen(false);
    } finally {
      setIsReporting(false);
    }
  };

  const handleBlockUser = async () => {
    try {
      await blockUser({ user_blocked: post.user.userId, is_blocking: true });
      toast({
        title: "User blocked successfully",
        description: `You will no longer see posts from ${post.user.firstName}`,
      });
      usePostStore.getState().fetchPosts(true);

    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to block user",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const imageUrls = useMemo(
    () =>
      [...post.assets]
        .sort((a, b) => a.position - b.position)
        .map((a) => a.url),
    [post.assets]
  );

  const handleProfile = () => {
    navigate(`/profile/${post.user.userId}`)
  }

  const handleCommentClick = useCallback(() => {
    setShowComments(true);
  }, []);



  return (
    <article
      className="bg-card rounded-2xl my-3 border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-3 ">
        <div className="flex gap-3 cursor-pointer" onClick={handleProfile}>
          <Avatar className="w-11 h-11 shrink-0 ">
            {post.user.profile_image_url ? (
              <AvatarImage src={post.user.profile_image_url} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{post.user.firstName + " " + post.user.lastName}</span>

            </div>
            <span className="text-xs text-muted-foreground">
              {formatPostDate(post.createdAt)}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0 -mt-1 -mr-1">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {isOwner ? (
              <>
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
              </>
            ) : (
              <>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => setReportDialogOpen(true)}
                >
                  <Flag className="w-4 h-4" />
                  Report Post
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => setBlockDialogOpen(true)}
                >
                  <User className="w-4 h-4" />
                  Block User
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
            "text-muted-foreground hover:text-primary hover:bg-rose-500/10 transition-colors",
            post.isLiked && "text-primary"
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
        <ConfirmDialog
          open={blockDialogOpen}
          onOpenChange={
            async () => {
              setBlockDialogOpen(false);
            }}
          title="Block User?"
          description={`Are you sure you want to block ${post.user.firstName}? You will no longer see their posts.`}
          confirmText="Block"
          confirmVariant="destructive"
          loading={false}
          onConfirm={handleBlockUser}
        />

      </div>

      {/* Inline Comments Section */}
      <InlineComments
        postId={post.postId}
        commentCount={post.comments}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

      <ReportPostDialog
        isOpen={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        onSubmit={handleReport}
        isSubmitting={isReporting}
      />
    </article>
  );
}

export default memo(FeedPost);
