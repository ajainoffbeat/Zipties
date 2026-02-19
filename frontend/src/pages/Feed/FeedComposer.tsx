import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageIcon, Send, AlertCircle, Loader2 } from "lucide-react";
import ImagePreviewGrid from "@/components/media/ImagePreviewGrid";
import { useProfileStore } from "@/store/useProfileStore";
import { useFeedComposer } from "@/hooks/useFeedComposer";
import { cn } from "@/lib/utils";

export default function FeedComposer() {
  const { profile } = useProfileStore();
  const composer = useFeedComposer();

  return (
    <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-5 flex gap-4">
        <Avatar className="w-11 h-11">
          <AvatarImage src={profile?.profile_image_url} />
          <AvatarFallback>
            {profile?.first_name?.[0] ?? "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <textarea
            value={composer.content}
            onChange={(e) => composer.setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full resize-none bg-transparent focus:outline-none"
          />

          <ImagePreviewGrid
            images={composer.images}
            onRemove={(i) =>
              composer.setImages((p) => p.filter((_, idx) => idx !== i))
            }
          />

          {composer.error && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-2">
              <AlertCircle className="w-3 h-3" />
              {composer.error}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between px-5 py-3 border-t">
        <input
          ref={composer.fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && composer.readFiles(e.target.files)}
        />

        <Button
          variant="ghost"
          onClick={() => composer.fileRef.current?.click()}
        >
          <ImageIcon className="w-4 h-4 mr-1" />
          Photo
        </Button>

        <Button
          variant="hero"
          disabled={composer.isCreating}
          onClick={composer.submit}
        >
          {composer.isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 mr-1" /> Post
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
