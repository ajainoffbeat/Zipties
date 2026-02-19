import { useRef, useState } from "react";

export function useImageHandler() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [existingAssetIds, setExistingAssetIds] = useState<string[]>([]);
  const [removedAssetIds, setRemovedAssetIds] = useState<string[]>([]);
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

  const setInitialPreviews = (urls: string[], assetIds: string[] = []) => {
    setPreviews(urls);
    setExistingAssetIds(assetIds);
  };

  const remove = (index: number) => {
    // Check if this is an existing image (has an asset ID)
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
