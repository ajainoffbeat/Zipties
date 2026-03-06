import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createConversation } from "@/lib/api/messages.api";
import { blockUser } from "@/lib/api/user.api";
import { useAuthStore } from "@/store/authStore";
import { usePostStore } from "@/store/usePostStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useToast } from "@/components/ui/use-toast";

export function useProfileActions() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loggedInUserId = useAuthStore((s) => s.userId);

  const {
    profile,
    publicProfile,
    fetchProfileById,
    fetchMyProfile,
    loading,
    followUser,
    unfollowUser,
  } = useProfileStore();

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const displayProfile =
    userId && userId !== loggedInUserId ? publicProfile : profile;

  const isOwnProfile = !userId || userId === loggedInUserId;

  useEffect(() => {
    if (!loggedInUserId) return;

    if (userId && userId !== loggedInUserId) {
      fetchProfileById(userId);
    } else {
      fetchMyProfile(loggedInUserId);
    }
  }, [userId, loggedInUserId, fetchProfileById, fetchMyProfile]);

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  const handleMessage = async () => {
    if (!displayProfile?.id || !loggedInUserId) return;

    try {
      const res = await createConversation([
        loggedInUserId,
        displayProfile.id,
      ]);

      const conversationId = res.data.data.conversation_id;

      navigate(`/messages?id=${conversationId}`, {
        state: {
          user: {
            id: displayProfile.id,
            name: `${displayProfile.first_name} ${displayProfile.last_name}`,
            avatar: displayProfile.profile_image_url,
            initials: `${displayProfile.first_name?.[0] || ""}${displayProfile.last_name?.[0] || ""
              }`.toUpperCase(),
          },
        },
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const handleBlockUser = async (isBlocked: boolean) => {
    if (!displayProfile?.id) return;

    setIsBlocking(true);

    try {
      await blockUser({
        user_blocked: displayProfile.id,
        is_blocking: isBlocked,
      });

      toast({
        title: isBlocked ? "User Blocked" : "User Unblocked",
        description: isBlocked
          ? `${displayProfile.first_name} has been blocked.`
          : `${displayProfile.first_name} has been unblocked.`,
      });

      setBlockDialogOpen(false);

      usePostStore.getState().fetchPosts(true);

      navigate("/feed");
    } catch {
      toast({
        title: "Error",
        description: "Failed to block user.",
        variant: "destructive",
      });
    } finally {
      setIsBlocking(false);
    }
  };

  const handleFollow = async () => {
    if (!displayProfile?.id) return;

    try {
      await followUser(displayProfile.id);

      toast({
        title: "Success",
        description: `You are now following ${displayProfile.first_name}`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to follow user.",
        variant: "destructive",
      });
    }
  };

  const handleUnfollow = async () => {
    if (!displayProfile?.id) return;

    try {
      await unfollowUser(displayProfile.id);

      toast({
        title: "Success",
        description: `You have unfollowed ${displayProfile.first_name}`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to unfollow user.",
        variant: "destructive",
      });
    }
  };

  return {
    loading,
    displayProfile,
    isOwnProfile,
    blockDialogOpen,
    setBlockDialogOpen,
    isBlocking,
    handleEditProfile,
    handleMessage,
    handleBlockUser,
    handleFollow,
    handleUnfollow,
  };
}