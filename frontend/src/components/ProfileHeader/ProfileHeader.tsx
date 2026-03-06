import { ProfileAvatar } from "@/components/ProfileAvtar/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Edit2, MessageCircle, UserPlus, Ban, MapPin, Calendar } from "lucide-react";
import { ConfirmDialog } from "../common/ConfirmDialog";

interface Props {
  profile: any;
  isOwnProfile: boolean;
  onEdit: () => void;
  onMessage: () => void;
  onFollow: () => void;
  onUnfollow: () => void;
  onBlock: (isBlocked: boolean) => void;
  blockDialogOpen: boolean;
  setBlockDialogOpen: (open: boolean) => void;
  isBlocking: boolean;
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  onEdit,
  onMessage,
  onFollow,
  onUnfollow,
  onBlock,
  blockDialogOpen,
  setBlockDialogOpen,
  isBlocking,
}: Props) {
  return (
    <div className="bg-card rounded-2xl border p-6 mb-6">

      <div className="flex gap-6">

        <ProfileAvatar profile={profile} />

       <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1">
                        {profile?.first_name} {profile?.last_name}
                      </h1>
                      <p className="text-muted-foreground">{profile?.username}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isOwnProfile ? (
                        <Button variant="secondary" size="sm" className="gap-1 px-4 bg-primary text-primary-foreground hover:bg-primary/80" onClick={onEdit}>
                          <Edit2 className="w-4 h-4" />
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button variant="hero" size="sm" className="gap-1 px-4" onClick={onMessage}>
                            <MessageCircle className="w-4 h-4" />
                            Message
                          </Button>
                          {profile?.is_following ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1 px-4"
                              onClick={onUnfollow}
                            >
                              <UserPlus className="w-4 h-4" />
                              Unfollow
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1 px-4"
                              onClick={onFollow}
                            >
                              <UserPlus className="w-4 h-4" />
                              Follow
                            </Button>
                          )}
                          {profile?.isblocked ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1 px-4 text-gray-500 hover:text-gray-500 hover:bg-gray-500/10"
                              onClick={() => onBlock(false)}
                            >
                              <Ban className="w-4 h-4" />
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onBlock(true)}
                            >
                              <Ban className="w-4 h-4" />
                              Block
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-foreground text-sm md:text-base leading-relaxed mb-4 max-w-2xl">
                    {profile?.bio}
                  </p>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-1.5 font-medium">
                      <strong className="text-foreground">{profile?.followers_count || 0}</strong> Followers
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <strong className="text-foreground">{profile?.following_count || 0}</strong> Following
                    </span>
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
                </div>

      </div>

    </div>
  );
}