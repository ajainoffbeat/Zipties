import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, ImageIcon, Loader2 } from "lucide-react";
import ImagePreviewGrid from "@/components/media/ImagePreviewGrid";
import { cn } from "@/lib/utils/utils";
import { useProfileStore } from "@/store/useProfileStore";

type Props = {
  content: string;
  setContent: (v: string) => void;

  images: string[];
  onRemoveImage: (index: number) => void;

  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  onDrop: (files: FileList) => void;

  inputRef: React.RefObject<HTMLInputElement>;
  onPickImage: () => void;

  onSubmit: () => void;
  onCancel: () => void;

  loading: boolean;
  error?: string | null;
};

export default function EditPostForm({
  content,
  setContent,
  images,
  onRemoveImage,
  isDragging,
  setIsDragging,
  onDrop,
  inputRef,
  onPickImage,
  onSubmit,
  onCancel,
  loading,
  error,
}: Props) {
  const { profile } = useProfileStore();

  const charLimit = 200;
  const isOverLimit = content?.length > charLimit;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Post</h1>
      </div>

      {/* Form */}
      <div
        className={cn(
          "bg-card rounded-3xl border shadow-lg overflow-hidden",
          isDragging && "border-primary/60"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          onDrop(e.dataTransfer.files);
        }}
      >
        <div className="p-6 flex gap-4">
          <Avatar className="w-12 h-12 shrink-0">
            <AvatarImage src={profile?.profile_image_url} />
            <AvatarFallback>
              {profile?.first_name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent resize-none focus:outline-none min-h-[120px]"
              placeholder="Update your post..."
            />

            <ImagePreviewGrid
              images={images}
              onRemove={onRemoveImage}
            />

            {error && (
              <p className="text-xs text-destructive flex gap-1 mt-2">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) onDrop(e.target.files);
              e.target.value = "";
            }}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onPickImage}
            disabled={loading}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Photo
          </Button>

          <Button
            variant="hero"
            disabled={!content?.trim() || isOverLimit || loading}
            onClick={onSubmit}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
