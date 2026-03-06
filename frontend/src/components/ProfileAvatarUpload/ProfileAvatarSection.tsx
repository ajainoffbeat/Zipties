import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Upload } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "@/lib/validators/profile.schema";
import { useRef } from "react";
import { useProfileStore } from "@/store/useProfileStore";

type Props = {
  form: UseFormReturn<ProfileFormValues>;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
};

export function ProfileAvatarSection({ form, selectedFile, setSelectedFile }: Props) {
  const { profile } = useProfileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImageUrl = form.watch("profileImageUrl");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store the file for later upload
    setSelectedFile(file);
    
    // Create preview URL immediately
    const previewUrl = URL.createObjectURL(file);
    form.setValue("profileImageUrl", previewUrl);
  };

  return (
    <Card>
      <CardContent className="pt-6 flex gap-6 items-center">
        <div className="relative group">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-2 border-border">
            {profileImageUrl ? (
              <img src={profileImageUrl.startsWith('/uploads') ? `${profileImageUrl}` : profileImageUrl} className="object-cover w-full h-full" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-2xl md:text-3xl font-bold">
                {profile.first_name?.[0] || profile.username?.[0] || "U"}
              </AvatarFallback>
            )}
          </Avatar>
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
            >
              <Upload className="w-4 h-4" />
              {selectedFile ? "Photo Selected" : "Change Photo"}
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