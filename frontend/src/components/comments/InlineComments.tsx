import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePostStore } from "@/store/usePostStore";
import { useProfileStore } from "@/store/useProfileStore";
import { Loader2, Send, Heart, MoreHorizontal, Trash2, Reply, X } from "lucide-react";
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
    profileImageUrl?: string;
  };
}

interface InlineCommentsProps {
  postId: string;
  commentCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export function InlineComments({ postId, commentCount, isOpen, onClose }: InlineCommentsProps) {
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
      const data = await getPostComments(postId, 3, currentOffset); // Show fewer comments initially
      
      if (reset) {
        setComments(data.comments || []);
        setOffset(3);
      } else {
        setComments(prev => [...prev, ...(data.comments || [])]);
        setOffset(prev => prev + 3);
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
      await loadComments(true);
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen && postId) {
      loadComments(true);
    }
  }, [isOpen, postId]);

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
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, isLiked: !comment.isLiked, likes: (comment.likes || 0) + (comment.isLiked ? -1 : 1) }
        : comment
    ));
  };

  const handleDeleteComment = async (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    setReplyText("");
    setReplyingTo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="border-t border-border bg-muted/20">
      {/* Comments Header */}
      <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground">Comments</h3>
          <span className="text-xs text-muted-foreground">{commentCount}</span>
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
            console.log(comment),
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={comment.user.profileImageUrl} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium text-xs border border-primary/20">
                  {(comment.user.firstName?.[0] ?? "") + (comment.user.lastName?.[0] ?? "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground hover:underline cursor-pointer">
                        {comment.user.firstName} {comment.user.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed break-words">
                      {comment.comment}
                    </p>
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
                className="text-muted-foreground hover:text-foreground text-xs font-medium"
              >
                {isLoading ? (
                  <><Loader2 className="w-3 h-3 animate-spin mr-1" />Loading...</>
                ) : (
                  "Load more comments"
                )}
              </Button>
            </div>
          )}
          
          {comments.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
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
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[36px] max-h-24 resize-none border-muted-foreground/20 focus-visible:ring-primary/20 bg-muted/30 text-sm"
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
    </div>
  );
}
