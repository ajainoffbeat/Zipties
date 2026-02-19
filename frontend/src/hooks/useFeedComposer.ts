import { useRef, useState } from "react";
import { usePostStore } from "@/store/usePostStore";

export function useFeedComposer() {
  const { createPost, isCreating } = usePostStore();

  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const readFiles = (list: FileList | File[]) => {
    Array.from(list).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      setFiles((p) => [...p, file]);

      const reader = new FileReader();
      reader.onload = (e) =>
        setImages((p) => [...p, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const submit = async () => {
    const trimmed = content.trim();
    if (!trimmed && files.length === 0) return;

    if (trimmed.length > 200) {
      setError("Post must be under 200 characters.");
      return;
    }

    setError(null);
    await createPost(trimmed, files);

    setContent("");
    setImages([]);
    setFiles([]);
  };

  return {
    content,
    setContent,
    images,
    setImages,
    fileRef,
    readFiles,
    submit,
    error,
    isCreating,
  };
}
