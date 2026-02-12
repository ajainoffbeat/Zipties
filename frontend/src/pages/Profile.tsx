import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";


import { useParams } from "react-router-dom";
import { createConversation } from "@/lib/api/chat.api";
import { useToast } from "@/components/ui/use-toast";

import { Ban } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { blockUser } from "@/lib/api/block.api";

export default function Profile() {
  const { userId } = useParams();
  const { profile, publicProfile, fetchProfile, fetchProfileByUsername, loading } = useProfileStore();
  const navigate = useNavigate();
  const loggedInUserId = useAuthStore((s) => s.userId);
  const { toast } = useToast();
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfileByUsername(userId);
    } else if (loggedInUserId) {
      fetchProfile(loggedInUserId);
    }
  }, [userId, loggedInUserId]);

  const displayProfile = userId ? publicProfile : profile;
  const isOwnProfile = !userId || (displayProfile?.id === loggedInUserId);

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  const handleMessage = async () => {
    if (!displayProfile?.id || !loggedInUserId) return;

    try {
      const res = await createConversation([loggedInUserId, displayProfile.id]);
      const conversationId = res.data.data.conversation_id;
      navigate(`/messages?id=${conversationId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  const handleBlockUser = async () => {
    if (!displayProfile?.id) return;
    setIsBlocking(true);
    try {
      await blockUser(displayProfile.id, true);
      toast({
        title: "User Blocked",
        description: `${displayProfile.first_name} has been blocked.`,
      });
      setBlockDialogOpen(false);
      navigate("/feed"); // Navigate away after blocking
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block user.",
        variant: "destructive"
      });
    } finally {
      setIsBlocking(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (userId && !publicProfile && !loading) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">User Not Found</h2>
          <p className="text-muted-foreground mb-6">This user might have blocked you or their account is private.</p>
          <Button variant="link" onClick={() => navigate("/feed")}>Go to Feed</Button>
        </div>
      </AppLayout>
    );
  }

  console.log("displayProfile", displayProfile);
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm mb-6 p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-start">
              {/* Avatar section */}
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-xl">
                <AvatarImage
                  src={`http://localhost:5000${displayProfile?.profile_image_url}`}
                  alt="Profile image"
                />
                <AvatarFallback className="bg-primary/5 text-primary text-2xl md:text-4xl font-bold">
                  {displayProfile?.first_name?.[0]}
                  {displayProfile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>

              {/* Info section */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1">
                      {displayProfile?.first_name} {displayProfile?.last_name}
                    </h1>
                    <p className="text-muted-foreground">@{displayProfile?.username}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isOwnProfile ? (
                      <Button variant="outline" size="sm" className="gap-1 px-4" onClick={handleEditProfile}>
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button variant="hero" size="sm" className="gap-1 px-4" onClick={handleMessage}>
                          <MessageCircle className="w-4 h-4" />
                          Message
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setBlockDialogOpen(true)}
                        >
                          <Ban className="w-4 h-4" />
                          Block
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Block {displayProfile?.first_name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        They won't be able to message you or find your profile in search. You can unblock them later from your settings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          handleBlockUser();
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isBlocking}
                      >
                        {isBlocking ? "Blocking..." : "Block User"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <p className="text-foreground text-sm md:text-base leading-relaxed mb-4 max-w-2xl">
                  {displayProfile?.bio}
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
                  {displayProfile?.city_name && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-primary" />
                      {displayProfile.city_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-primary" />
                    Joined{" "}
                    {displayProfile?.joined_date
                      ? new Date(displayProfile.joined_date).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                      })
                      : ""}
                  </span>
                </div>

              </div>
            </div>

            {/* Tags/Interests Section */}
            {(displayProfile?.interests || displayProfile?.tags) && (
              <div className="mt-8 pt-6 border-t border-border space-y-4">
                {displayProfile?.interests && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Interests:</span>
                    {displayProfile.interests.split(',').map((interest, i) => (
                      <Badge key={i} variant="secondary" className="font-medium cursor-pointer hover:bg-secondary/80">
                        {interest.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                {displayProfile?.tags && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Skills:</span>
                    {displayProfile.tags.split(',').map((tag, i) => (
                      <Badge key={i} variant="outline" className="font-medium cursor-pointer hover:border-primary">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
