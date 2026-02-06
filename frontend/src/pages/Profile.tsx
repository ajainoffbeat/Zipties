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
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm mb-6">
            {/* Cover */}
            <div className="h-32 md:h-48 bg-gradient-hero" />

            {/* Profile Info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-12 md:-mt-16 mb-4">
                <div className="flex items-end gap-4">
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-card shadow-lg">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl md:text-3xl font-bold">
                      {mockUser.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block mb-2">
                    <h1 className="text-2xl font-bold text-foreground">{profile?.name}</h1>
                    <p className="text-muted-foreground">{profile?.username}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Button variant="outline" size="sm" className="gap-1" onClick={handleEditProfile}>
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="md:hidden mb-4">
                <h1 className="text-xl font-bold text-foreground">{profile?.name}</h1>
                <p className="text-muted-foreground text-sm">{profile?.username}</p>
              </div>

              <p className="text-foreground mb-4">{profile?.bio}</p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile?.location}
                </span>
                <span className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  <a href="#" className="text-primary hover:underline">{profile?.website}</a>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {profile?.joined_date}
                </span>
              </div>

              <div className="flex gap-6">
                <button className="hover:underline">
                  <span className="font-bold text-foreground">{mockUser.followers.toLocaleString()}</span>{" "}
                  <span className="text-muted-foreground">Followers</span>
                </button>
                <button className="hover:underline">
                  <span className="font-bold text-foreground">{mockUser.following.toLocaleString()}</span>{" "}
                  <span className="text-muted-foreground">Following</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { icon: FileText, label: "Posts", value: mockUser.posts },
              { icon: Users, label: "Proposals", value: mockUser.proposals },
              { icon: ShoppingBag, label: "Listings", value: mockUser.listings },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-card rounded-xl border border-border p-4 text-center shadow-sm"
              >
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="posts">
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
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
