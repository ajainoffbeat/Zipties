import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Edit2,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Users,
  FileText,
  ShoppingBag,
  Heart,
  MessageCircle,
  MoreHorizontal
} from "lucide-react";
import { useProfileStore } from "@/store/useProfileStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const mockUser = {
  name: "John Doe",
  username: "@johndoe",
  initials: "JD",
  bio: "Designer & Developer. Building tools for communities. Love connecting with like-minded people!",
  location: "San Francisco, CA",
  website: "johndoe.com",
  joinedDate: "January 2024",
  followers: 1240,
  following: 890,
  posts: 42,
  proposals: 5,
  listings: 8,
};

const mockPosts = [
  {
    id: 1,
    content: "Just finished my latest project! Can't wait to share it with everyone. 🚀",
    likes: 89,
    comments: 12,
    timeAgo: "2h",
  },
  {
    id: 2,
    content: "Looking forward to the community meetup next week. Who else is going?",
    likes: 45,
    comments: 23,
    timeAgo: "1d",
  },
];


export default function Profile() {
  const { profile, fetchProfile, loading } = useProfileStore();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    fetchProfile(userId);
  }, []);

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm mb-6 p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
              {/* Avatar section */}
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-md shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl md:text-3xl font-bold">
                  {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Info section */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      {profile?.first_name} {profile?.last_name}
                    </h1>
                    <p className="text-muted-foreground">{profile?.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1 px-4" onClick={handleEditProfile}>
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </div>
                </div>

                <p className="text-foreground text-sm md:text-base leading-relaxed mb-4 max-w-2xl">
                  {profile?.bio}
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
                  {profile?.city_name && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-primary" />
                      {profile.city_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-primary" />
                    Joined{" "}
                    {profile?.joined_date
                      ? new Date(profile.joined_date).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                      })
                      : ""}
                  </span>
                </div>

                {/* <div className="flex gap-8 border-t border-border pt-6">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-foreground">{mockUser.followers.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Followers</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-foreground">{mockUser.following.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Following</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-foreground">{mockUser.posts}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Posts</span>
                  </div>
                </div> */}
              </div>
            </div>

            {/* Tags/Interests Section */}
            {(profile?.interests || profile?.tags) && (
              <div className="mt-8 pt-6 border-t border-border space-y-4">
                {profile?.interests && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Interests:</span>
                    {profile.interests.split(',').map((interest, i) => (
                      <Badge key={i} variant="secondary" className="font-medium cursor-pointer hover:bg-secondary/80">
                        {interest.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                {profile?.tags && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Skills:</span>
                    {profile.tags.split(',').map((tag, i) => (
                      <Badge key={i} variant="outline" className="font-medium cursor-pointer hover:border-primary">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          {/* <Tabs defaultValue="posts">
            <TabsList className="w-full justify-start mb-6">
              <TabsTrigger value="posts" className="gap-1">
                <FileText className="w-4 h-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="proposals" className="gap-1">
                <Users className="w-4 h-4" />
                Proposals
              </TabsTrigger>
              <TabsTrigger value="listings" className="gap-1">
                <ShoppingBag className="w-4 h-4" />
                Listings
              </TabsTrigger>
              <TabsTrigger value="likes" className="gap-1">
                <Heart className="w-4 h-4" />
                Likes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              {mockPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-card rounded-xl border border-border p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {mockUser.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-semibold text-foreground">{mockUser.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">{post.timeAgo}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </div>
                  <p className="text-foreground mb-4">{post.content}</p>
                  <div className="flex gap-4">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Heart className="w-4 h-4 mr-1" />
                      {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {post.comments}
                    </Button>
                  </div>
                </article>
              ))}
            </TabsContent>

            <TabsContent value="proposals">
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No proposals yet</p>
              </div>
            </TabsContent>

            <TabsContent value="listings">
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No listings yet</p>
              </div>
            </TabsContent>

            <TabsContent value="likes">
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No liked posts yet</p>
              </div>
            </TabsContent>
          </Tabs> */}
        </div>
      </div>
    </AppLayout>
  );
}
