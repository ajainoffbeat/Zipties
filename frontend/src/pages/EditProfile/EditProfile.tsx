import { AccountInfoSection } from "@/components/AccountInfo/AccountInformation";
import { BasicInfoSection } from "@/components/BasicInfoSection/BasicInfoSection";
import { AppLayout } from "@/components/layout/AppLayout";
import { InterestsLocationSection } from "@/components/LocationSection/InterestsLocation";
import { ProfileAvatarSection } from "@/components/ProfileAvatarUpload/ProfileAvatarSection";
import { ProfileActions } from "@/components/ProfileEditActions/ProfileEditActions";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";
import { ProfileFormValues, profileSchema } from "@/lib/validators/profile.schema";
import { useProfileStore } from "@/store/useProfileStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadAvatar } from "@/lib/api/user.api";

export default function EditProfilePage() { 
  const {profile, updateProfile, loading } = useProfileStore();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.first_name || "",
      lastName: profile?.last_name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      profileImageUrl: profile?.profile_image_url || "",
      interests: profile?.interests || "",
      tags: profile?.tags || "",
      cityId: profile?.city_id || "",
      cityName: profile?.city_name || "",
    },
  });

  // Update form when profile data loads
  React.useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        profileImageUrl: profile.profile_image_url || "",
        interests: profile.interests || "",
        tags: profile.tags || "",
        cityId: profile.city_id || "",
        cityName: profile.city_name || "",
      });
    }
  }, [profile, form]);
  
  const { handleSubmit } = form;
  const onSubmit = async (data: ProfileFormValues) => {
    let finalProfileImageUrl = data.profileImageUrl;
    
    // Upload image if a new file was selected
    if (selectedFile) {
      const formData = new FormData();
      formData.append("avatar", selectedFile);
      
      try {
        const res = await uploadAvatar(formData);
        finalProfileImageUrl = res.data.data.url;
      } catch (err) {
        console.error("Failed to upload image", err);
        // Keep the original image if upload fails
        finalProfileImageUrl = profile?.profile_image_url || "";
      }
    }
    await updateProfile({ ...data, profileImageUrl: finalProfileImageUrl });
    navigate("/profile");
  };
  if (loading) return <ProfileSkeleton />;
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <ProfileAvatarSection form={form} selectedFile={selectedFile} setSelectedFile={setSelectedFile} />
          <BasicInfoSection form={form} errors={form.formState.errors} />
          <InterestsLocationSection form={form} errors={form.formState.errors} />
          <AccountInfoSection form={form} />
          <ProfileActions isSubmitting={form.formState.isSubmitting} />
        </form>
      </div>
    </AppLayout>
  );
}