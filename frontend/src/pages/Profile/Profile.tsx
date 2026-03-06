import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { useProfileActions } from "@/hooks/useUserProfile";

import { ProfileHeader } from "@/components/ProfileHeader/ProfileHeader";
import { ProfileInterests } from "@/components/ProfileInterests/ProfileInterests";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export default function Profile() {
    const {
        loading,
        displayProfile,
        isOwnProfile,
        handleEditProfile,
        handleMessage,
        handleBlockUser,
        handleFollow,
        handleUnfollow,
        blockDialogOpen,
        setBlockDialogOpen,
        isBlocking,
    } = useProfileActions();

    if (loading) {
        return (
            <AppLayout>
                <ProfileSkeleton />
            </AppLayout>
        );
    }
    console.log(blockDialogOpen)

    return (
        <AppLayout>
            <div className="container mx-auto px-4 py-8 mb-60 max-w-4xl">

                <ProfileHeader
                    profile={displayProfile}
                    isOwnProfile={isOwnProfile}
                    onEdit={handleEditProfile}
                    onMessage={handleMessage}
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                    onBlock={handleBlockUser}
                    blockDialogOpen={blockDialogOpen}
                    setBlockDialogOpen={setBlockDialogOpen}
                    isBlocking={isBlocking}
                />

                <ProfileInterests profile={displayProfile} />
                
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


            </div>
        </AppLayout>
    );
}