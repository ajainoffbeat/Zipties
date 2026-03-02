import { useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

export function useImageHandler() {
  const { toast } = useToast();

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [existingAssetIds, setExistingAssetIds] = useState<string[]>([]);
  const [removedAssetIds, setRemovedAssetIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFiles = (incoming: FileList | File[]) => {
    const maxSize = 2 * 1024 * 1024; // 2MB

    Array.from(incoming).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `The Selected file size  must be under 2MB.`,
          variant: "destructive",
        });
        return; // skip this file
      }

      setFiles((f) => [...f, file]);

      const reader = new FileReader();
      reader.onload = (e) =>
        setPreviews((p) => [...p, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const setInitialPreviews = (urls: string[], assetIds: string[] = []) => {
    setPreviews(urls);
    setExistingAssetIds(assetIds);
  };

  const remove = (index: number) => {
    const assetId = existingAssetIds[index];
    if (assetId) {
      setRemovedAssetIds((prev) => [...prev, assetId]);
    }

    setFiles((f) => f.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
    setExistingAssetIds((ids) => ids.filter((_, i) => i !== index));
  };

  const reset = () => {
    setFiles([]);
    setPreviews([]);
    setExistingAssetIds([]);
    setRemovedAssetIds([]);
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
    removedAssetIds,
    inputRef,
  };
}