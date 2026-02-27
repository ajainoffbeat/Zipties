import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, X, MoreHorizontal, Flag } from "lucide-react";
import { useState } from "react";
import { useProfileStore } from "@/store/useProfileStore";
import { useInlineComments } from "@/hooks/useInlineComments";
import { formatCommentTime } from "@/lib/utils/formatTime";
import { ReportCommentDialog } from "./ReportCommentDialog";
import { reportComment } from "@/lib/api/post.api";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InlineCommentsProps {
  postId: string;
  commentCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export function InlineComments({
  postId,
  commentCount,
  isOpen,
  onClose,
}: InlineCommentsProps) {
  const { profile } = useProfileStore();
  const { toast } = useToast();

  const {
    comments,
    newComment,
    setNewComment,
    isLoading,
    isSubmitting,
    hasMore,
    loadComments,
    submitComment,
  } = useInlineComments(postId, isOpen);

  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  const handleReportComment = async (reason: string) => {
    if (!selectedCommentId) return;
    
    setIsReporting(true);
    try {
      await reportComment(selectedCommentId, reason);
      toast({
        title: "Comment reported successfully",
        description: "The comment has been reported for review.",
      });
      setReportDialogOpen(false);
      setSelectedCommentId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReporting(false);
    }
  };

  const openReportDialog = (commentId: string) => {
    setSelectedCommentId(commentId);
    setReportDialogOpen(true);
  };

  if (!isOpen) return null;

  const initials =
    (profile?.first_name?.[0] ?? "") +
    (profile?.last_name?.[0] ?? "");

  return (
    <div className="border-t border-border bg-muted/20">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground">
            Comments
          </h3>
          <span className="text-xs text-muted-foreground">
            {commentCount}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-4 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={comment.user.profileImageUrl} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium text-xs border border-primary/20">
                  {(comment.user.firstName?.[0] ?? "") +
                    (comment.user.lastName?.[0] ?? "U")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground hover:underline cursor-pointer">
                        {comment.user.firstName}{" "}
                        {comment.user.lastName}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {formatCommentTime(comment.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-foreground leading-relaxed break-words">
                      {comment.comment}
                    </p>
                  </div>
                  
                  {/* Report button - only show for other users' comments */}
                  {comment.user.id !== profile?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground ml-2"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openReportDialog(comment.id)}
                          className="text-red-600 focus:text-white cursor-pointer"
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Report Comment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          ))}

          {hasMore && comments.length > 0 && (
            <div className="text-center py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadComments()}
                disabled={isLoading}
                className="text-muted-foreground hover:text-foreground  text-xs font-medium hover:text-white "    // TODO: Change hover:text-black to hover:text-white
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Loading...
                  </>
                ) : (
                  "Load more comments"
                )}
              </Button>
            </div>
          )}

          {comments.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                No comments yet. Be the first to comment!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comment Input */}
      <div className="border-t border-border/50 p-4 bg-background">
        <div className="flex gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={profile?.profile_image_url} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium text-xs border border-primary/20">
              {initials.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) =>
                setNewComment(e.target.value)
              }
              className="min-h-[36px] max-h-24 resize-none border-muted-foreground/20 focus-visible:ring-primary/20 bg-muted/30 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitComment();
                }
              }}
            />

            <Button
              onClick={submitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="shrink-0 h-9 px-3 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Comment Dialog */}
      <ReportCommentDialog
        isOpen={reportDialogOpen}
        onClose={() => {
          setReportDialogOpen(false);
          setSelectedCommentId(null);
        }}
        onSubmit={handleReportComment}
        isSubmitting={isReporting}
      />
    </div>
  );
}