import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePostStore } from "@/store/usePostStore";
import { useProfileStore } from "@/store/useProfileStore";
import { Loader2, Send, Heart, MoreHorizontal, Trash2, Reply } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  comment: string;
  userId: string;
  createdAt: string;
  likes?: number;
  isLiked?: boolean;
  user: {
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    profile_image_url?: string;
  };
}

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  commentCount: number;
}

export function CommentsDialog({ open, onOpenChange, postId, commentCount }: CommentsDialogProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { profile } = useProfileStore();
  const { getPostComments, createComment } = usePostStore();

  const loadComments = async (reset = false) => {
    if (isLoading || (!hasMore && !reset)) return;

    setIsLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const data = await getPostComments(postId, 20, currentOffset);
      
      if (reset) {
        setComments(data.comments || []);
        setOffset(20);
      } else {
        setComments(prev => [...prev, ...(data.comments || [])]);
        setOffset(prev => prev + 20);
      }
      
      setHasMore(data.hasMore !== false);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createComment(postId, newComment.trim());
      setNewComment("");
      // Reload comments to show the new one
      await loadComments(true);
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (open && postId) {
      loadComments(true);
    }
  }, [open, postId]);

  const initials = (profile?.first_name?.[0] ?? "") + (profile?.last_name?.[0] ?? "");

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true });
      } else if (diffInHours < 24 * 7) {
        return date.toLocaleDateString("en-US", { weekday: 'short' });
      } else {
        return date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
      }
    } catch {
      return "some time ago";
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // Implement like comment functionality
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, isLiked: !comment.isLiked, likes: (comment.likes || 0) + (comment.isLiked ? -1 : 1) }
        : comment
    ));
  };

  const handleDeleteComment = async (commentId: string) => {
    // Implement delete comment functionality
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    // Implement reply functionality
    setReplyText("");
    setReplyingTo(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Comments</h2>
          <span className="text-sm text-muted-foreground">{commentCount}</span>
        </div>
        
        {/* Comments List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-1">
          {comments.map((comment) => (
            <div key={comment.id} className="group hover:bg-muted/30 transition-colors -mx-2 px-2 py-2 rounded-lg">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={comment.user.profile_image_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium text-sm border border-primary/20">
                    {(comment.user.firstName?.[0] ?? "") + (comment.user.lastName?.[0] ?? "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground hover:underline cursor-pointer">
                          {comment.user.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed break-words">
                        {comment.comment}
                      </p>
                      
                      {/* Comment Actions */}
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={cn(
                            "flex items-center gap-1 text-xs transition-colors",
                            comment.isLiked 
                              ? "text-red-500 hover:text-red-600" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Heart className={cn("w-3.5 h-3.5", comment.isLiked && "fill-current")} />
                          <span>{comment.likes || 0}</span>
                        </button>
                        <button
                          onClick={() => setReplyingTo(comment.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                        {comment.userId === profile?.id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                      
                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                          <div className="flex gap-2">
                            <Avatar className="w-6 h-6 shrink-0">
                              <AvatarImage src={profile?.profile_image_url} />
                              <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                                {initials.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <Textarea
                                placeholder={`Reply to ${comment.user.username}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="min-h-[32px] max-h-24 resize-none text-sm border-0 bg-background focus-visible:ring-1"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleReply(comment.id);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleReply(comment.id)}
                                disabled={!replyText.trim()}
                                className="shrink-0 h-8 px-2"
                              >
                                <Send className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* More options */}
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
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
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Loading...</>
                ) : (
                  "Load more comments"
                )}
              </Button>
            </div>
          )}
          
          {comments.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Reply className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No comments yet</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
        </div>

        {/* Comment Input */}
        <div className="border-t p-4 bg-background">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={profile?.profile_image_url} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium border border-primary/20">
                {initials.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[44px] max-h-32 resize-none border-muted-foreground/20 focus-visible:ring-primary/20 bg-muted/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="shrink-0 h-11 px-4 bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
