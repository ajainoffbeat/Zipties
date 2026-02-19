import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Edit2,
  MapPin,
  Calendar,
  MessageCircle,

} from "lucide-react";
import { useProfileStore } from "@/store/useProfileStore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { blockUser } from "@/lib/api/user.api";
import { useParams } from "react-router-dom";
import { createConversation } from "@/lib/api/messages.api";
import { useToast } from "@/components/ui/use-toast";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";

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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export default function Profile() {
  const { userId } = useParams();
  const { profile, publicProfile, fetchProfileById, loading } = useProfileStore();
  const navigate = useNavigate();
  const loggedInUserId = useAuthStore((s) => s.userId);
  const { toast } = useToast();
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    if (userId && userId !== loggedInUserId) {
      fetchProfileById(userId);
    }
  }, [userId, loggedInUserId, fetchProfileById]);

  const displayProfile = userId && userId !== loggedInUserId ? publicProfile : profile;
  const isOwnProfile = !userId || (userId === loggedInUserId);

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  const handleMessage = async () => {
    if (!displayProfile?.id || !loggedInUserId) return;

    try {
      const res = await createConversation([loggedInUserId, displayProfile.id]);
      const conversationId = res.data.data.conversation_id;
      navigate(`/messages?id=${conversationId}`, {
        state: {
          user: {
            id: displayProfile.id,
            name: `${displayProfile.first_name} ${displayProfile.last_name}`,
            avatar: displayProfile.profile_image_url,
            initials: `${displayProfile.first_name?.[0] || ""}${displayProfile.last_name?.[0] || ""}`.toUpperCase()
          }
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  const handleBlockUser = async (isBlocked: boolean) => {
    if (!displayProfile?.id) return;
    setIsBlocking(true);
    try {
      await blockUser({ user_blocked: displayProfile.id, is_blocking: isBlocked });
      toast({
        title: isBlocked ? "User Blocked" : "User Unblocked",
        description: isBlocked
          ? `${displayProfile.first_name} has been blocked.`
          : `${displayProfile.first_name} has been unblocked.`,
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


  return (
    <AppLayout>
      {loading ? (
        <ProfileSkeleton />
      ) : (
        <div className="container mx-auto px-4 py-8 mb-60">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm mb-6 p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 md:items-start">
                {/* Avatar section */}
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-xl ">
                  <AvatarImage
                    src={`${displayProfile?.profile_image_url}`}
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
                      <p className="text-muted-foreground">{displayProfile?.username}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isOwnProfile ? (
                        <Button variant="secondary" size="sm" className="gap-1 px-4 bg-primary text-primary-foreground hover:bg-primary/80" onClick={handleEditProfile}>
                          <Edit2 className="w-4 h-4" />
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button variant="hero" size="sm" className="gap-1 px-4" onClick={handleMessage}>
                            <MessageCircle className="w-4 h-4" />
                            Message
                          </Button>
                          {displayProfile?.isblocked ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1 px-4 text-gray-500 hover:text-gray-500 hover:bg-gray-500/10"
                              onClick={() => handleBlockUser(false)}
                            >
                              <Ban className="w-4 h-4" />
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setBlockDialogOpen(true)}
                            >
                              <Ban className="w-4 h-4" />
                              Block
                            </Button>
                          )
                          }
                        </>
                      )}
                    </div>
                  </div>

                  <ConfirmDialog
                    open={blockDialogOpen}
                    onOpenChange={setBlockDialogOpen}
                    title={`Block ${displayProfile?.first_name}?`}
                    description="They won't be able to message you or find your profile in search. You can unblock them later from your settings."
                    confirmText="Block User"
                    confirmVariant="destructive"
                    loading={isBlocking}
                    onConfirm={() => handleBlockUser(true)}
                  />

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
      )}
    </AppLayout>
  );
}
