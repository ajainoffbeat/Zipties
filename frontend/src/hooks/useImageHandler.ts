import { useRef, useState } from "react";

export function useImageHandler() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFiles = (incoming: FileList | File[]) => {
    Array.from(incoming).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      setFiles((f) => [...f, file]);
      const reader = new FileReader();
      reader.onload = (e) =>
        setPreviews((p) => [...p, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

    const setInitialPreviews = (urls: string[]) => {
    setPreviews(urls);
  };

  const remove = (index: number) => {
    setFiles((f) => f.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  };

  const reset = () => {
    setFiles([]);
    setPreviews([]);
  };

  return {
    files,
    previews,
    isDragging,
    setIsDragging,
    readFiles,
    setInitialPreviews,
    remove,
    reset,
    inputRef,
  };
}
