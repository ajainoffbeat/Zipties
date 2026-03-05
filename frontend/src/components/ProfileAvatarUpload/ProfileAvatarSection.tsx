import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Upload } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "@/lib/validators/profile.schema";
import { useRef, useState } from "react";
import { useProfileStore } from "@/store/useProfileStore";
import { uploadAvatar } from "@/lib/api/user.api";


type Props = {
  form: UseFormReturn<ProfileFormValues>;
};

export function ProfileAvatarSection({ form }: Props) {
  const { profile } = useProfileStore();
  const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
 
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("file",file);
    if (!file) return;
    setUploadingImage(true);
    const previewUrl = URL.createObjectURL(file);
        let finalProfileImageUrl = profile.profile_image_url;
        console.log("finalProfileImageUrl",finalProfileImageUrl);

    if (file) {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("profileImageUrl", file);

      try {
        const res = await uploadAvatar(formData);
        
        finalProfileImageUrl = res.data.data.url;
      } catch (err) {
        console.error("Failed to upload image", err);
        setUploadingImage(false);
        return; // Stop if upload fails
      } finally {
        setUploadingImage(false);
      }
    }
    console.log("previewUrl",previewUrl);
    form.setValue("profileImageUrl", previewUrl);
    setUploadingImage(false);
  };
    return (
          <Card>
              <CardContent className="pt-6 flex gap-6 items-center">
                <div className="relative group">
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 border-2 border-border">
                    {profile.profile_image_url ? (
                      <img src={profile.profile_image_url.startsWith('/uploads') ? `${profile.profile_image_url}` : profile.profile_image_url} className="object-cover w-full h-full" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl md:text-3xl font-bold">
                        {profile.first_name?.[0] || profile.username?.[0] || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-full">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{profile?.first_name + " " + profile?.last_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload a high-resolution image to represent yourself.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingImage ? "Uploading..." : "Change Photo"}
                    </Button>
                  </div>
                  {form.formState.errors.profileImageUrl && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.profileImageUrl.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

    );
}