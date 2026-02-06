import { useState } from "react";
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
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const mockPosts = [
  {
    id: 1,
    author: {
      name: "Sarah Chen",
      username: "@sarahchen",
      avatar: "",
      initials: "SC",
    },
    content: "Just launched my new design system! 🎨 It's been months of work, but finally seeing it come together feels amazing. Would love to hear your thoughts!",
    image: null,
    likes: 142,
    comments: 28,
    shares: 12,
    timeAgo: "2h",
    isLiked: false,
  },
  {
    id: 2,
    author: {
      name: "Marcus Johnson",
      username: "@marcusj",
      avatar: "",
      initials: "MJ",
    },
    content: "Looking for co-founders for my new startup idea. We're building a platform to connect local artists with venues. DM if interested! 🚀",
    image: null,
    likes: 89,
    comments: 34,
    shares: 8,
    timeAgo: "4h",
    isLiked: true,
  },
  {
    id: 3,
    author: {
      name: "Emily Parker",
      username: "@emilyp",
      avatar: "",
      initials: "EP",
    },
    content: "The community meetup last weekend was incredible! Met so many amazing people. Can't wait for the next one. Thanks to everyone who organized it! ✨",
    image: null,
    likes: 256,
    comments: 45,
    shares: 23,
    timeAgo: "1d",
    isLiked: false,
  },
];

const trendingTopics = [
  { tag: "Startups", posts: "2.4k" },
  { tag: "Design", posts: "1.8k" },
  { tag: "Community", posts: "1.2k" },
  { tag: "Tech", posts: "980" },
];

export default function Feed() {
  const [posts, setPosts] = useState(mockPosts);
  const [newPost, setNewPost] = useState("");

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-6">
            {/* Create Post */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex gap-4">
                <Avatar className="w-11 h-11">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    U
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <textarea
                    placeholder="What's on your mind?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="w-full bg-transparent border-none resize-none focus:outline-none text-foreground placeholder:text-muted-foreground min-h-[60px]"
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Image className="w-4 h-4 mr-1" />
                        Photo
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Smile className="w-4 h-4 mr-1" />
                        Emoji
                      </Button>
                    </div>
                    {/* <Button variant="hero" size="sm" disabled={!newPost.trim()}>
                      <Send className="w-4 h-4 mr-1" />
                      Post
                    </Button> */}
                  </div>
                </div>
              </div>
            </div>

            {/* Posts */}
            {/* {posts.map((post) => (
              <article
                key={post.id}
                className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-3">
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {post.author.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {post.author.name}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {post.author.username}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {post.timeAgo}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>


                <p className="text-foreground leading-relaxed mb-4">
                  {post.content}
                </p>

                
                <div className="flex items-center gap-1 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={cn(
                      "text-muted-foreground",
                      post.isLiked && "text-accent"
                    )}
                  >
                    <Heart className={cn("w-4 h-4 mr-1.5", post.isLiked && "fill-current")} />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Share2 className="w-4 h-4 mr-1.5" />
                    {post.shares}
                  </Button>
                </div>
              </article>
            ))} */}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Trending */}
            {/* <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Trending Topics</h3>
              </div>
              <div className="space-y-3">
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
                {[
                  { name: "Alex Rivera", username: "@alexr", initials: "AR" },
                  { name: "Jordan Lee", username: "@jordanl", initials: "JL" },
                  { name: "Taylor Swift", username: "@taylor", initials: "TS" },
                ].map((person, index) => (
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
                    <Button variant="outline" size="sm">
                      Follow
                    </Button>
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
