// pages/feed/CreatePostCard.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertCircle, ImageIcon, ImagePlus, Send, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { useProfileStore } from "@/store/useProfileStore";
import { usePostComposer } from "@/hooks/usePostComposer";
import { useImageHandler } from "@/hooks/useImageHandler";

export default function CreatePostCard() {
  const { profile } = useProfileStore();
  const images = useImageHandler();
  const composer = usePostComposer(images.files);

  const charCount = composer.text.length;
  const charLimit = 200;
  const isOverLimit = charCount > charLimit;

  return (
    <div className={cn(
      "bg-card rounded-2xl border shadow-sm overflow-hidden transition-colors duration-200",
      images.isDragging ? "border-primary/60 bg-primary/5" : "border-border"
    )}
      onDragOver={(e) => {
        e.preventDefault();
        images.setIsDragging(true);
      }}
      onDragLeave={() => images.setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        images.setIsDragging(false);
        images.readFiles(e.dataTransfer.files);
      }}
    >
      <div className="p-5">
        <div className="flex gap-4">
          <Avatar className="w-11 h-11 shrink-0">
            <AvatarImage src={profile?.profile_image_url} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {profile?.first_name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <textarea
              placeholder="What's on your mind?"
              value={composer.text}
              onChange={(e) => {
                const value = e .target.value;
                if(value.length <= 200){
                 composer.setText(value)
                }else {
                  composer.setText(value.slice(0,200))
                }
              }}
              
              className="w-full bg-transparent border-none resize-none focus:outline-none text-foreground placeholder:text-muted-foreground min-h-[60px] text-[15px] leading-relaxed"
            />


            {images.previews.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {images.previews.map((src, i) => (
                  <div
                    key={i}
                    className="relative group rounded-xl overflow-hidden border border-border shadow-sm"
                    style={{ width: images.previews.length === 1 ? "100%" : "calc(50% - 4px)" }}
                  >
                    <img
                      src={src}
                      alt={`Preview ${i + 1}`}
                      className={cn("object-cover w-full", images.previews.length === 1 ? "max-h-72" : "h-36")}
                    />
                    <button
                      onClick={() => images.remove(i)}
                      className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/85 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}


            {images.isDragging && images.previews.length === 0 && (
              <div className="mt-3 border-2 border-dashed border-primary/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-primary/5">
                <ImagePlus className="w-8 h-8 text-primary/60" />
                <p className="text-sm text-muted-foreground">Drop images here</p>
              </div>
            )}


            <div className="flex items-center justify-between mt-2">
              <div>
                {composer.error && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {composer.error}
                  </p>
                )}
              </div>
              {charCount > 150 && (
                <span className={cn("text-xs tabular-nums", isOverLimit ? "text-destructive font-semibold" : "text-muted-foreground")}>
                  {charCount}/{charLimit}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>


      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary/30">
        <div className="flex gap-1 items-center">
          <input
            ref={images.inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) images.readFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            onClick={() => images.inputRef.current?.click()}
            disabled={composer.isCreating}
          >
            <ImageIcon className="w-4 h-4 mr-1.5" />
            Photo
            {images.previews.length > 0 && (
              <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {images.previews.length}
              </span>
            )}
          </Button>

        </div>
        <Button
          variant="hero"
          size="sm"
          disabled={composer.isCreating}
          onClick={() => composer.submit(images.reset)}
          className="gap-1.5 min-w-[72px]"
        >
          {composer.isCreating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Post
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
