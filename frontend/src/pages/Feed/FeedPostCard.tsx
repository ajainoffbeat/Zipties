import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PostMediaGrid from "@/components/media/PostMediaGrid";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function FeedPostCard({ post, onLike }) {
  return (
    <article className="bg-card rounded-2xl border shadow-sm">
      <div className="p-5 flex gap-3">
        <Avatar>
          <AvatarFallback>
            {post.user.firstName?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <p className="font-semibold">{post.user.username}</p>
          <p className="text-sm">{post.content}</p>
        </div>
      </div>

      <PostMediaGrid images={post.images} />

      <div className="flex px-4 py-2 border-t">
        <Button
          variant="ghost"
          onClick={() => onLike(post.postId)}
          className={cn(post.isLiked && "text-rose-500")}
        >
          <Heart className="w-4 h-4 mr-1" />
          {post.likes}
        </Button>

        <Button variant="ghost">
          <MessageCircle className="w-4 h-4 mr-1" />
          {post.comments}
        </Button>

        <Button variant="ghost">
          <Share2 className="w-4 h-4 mr-1" />
          {post.shares}
        </Button>
      </div>
    </article>
  );
}
