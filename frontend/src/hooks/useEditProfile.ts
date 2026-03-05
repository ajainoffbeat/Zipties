import { useState } from "react";
import { uploadAvatar } from "@/lib/api/user.api";

export const useUploadAvatar = () => {
  const [uploading, setUploading] = useState(false);

  const uploadAvatarFile = async (file: File): Promise<string | null> => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUploading(true);

      const res = await uploadAvatar(formData);

      const url = res?.data?.data?.url;

      return url ?? null;
    } catch (error) {
      console.error("Avatar upload failed:", error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadAvatar: uploadAvatarFile,
    uploading,
  };
};