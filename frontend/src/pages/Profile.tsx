import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Edit2,
  MapPin,
  Calendar,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { Ban } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useProfileActions } from "@/hooks/useUserProfile";

export default function Profile() {
  const {
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
  } = useProfileActions();

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
                          {displayProfile?.is_following ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1 px-4"
                              onClick={handleUnfollow}
                            >
                              <UserPlus className="w-4 h-4" />
                              Unfollow
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1 px-4"
                              onClick={handleFollow}
                            >
                              <UserPlus className="w-4 h-4" />
                              Follow
                            </Button>
                          )}
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
                          )}
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
                    <span className="flex items-center gap-1.5 font-medium">
                      <strong className="text-foreground">{displayProfile?.followers_count || 0}</strong> Followers
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <strong className="text-foreground">{displayProfile?.following_count || 0}</strong> Following
                    </span>
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
