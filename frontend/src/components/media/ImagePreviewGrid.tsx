import { X } from "lucide-react";
import { cn } from "@/lib/utils/utils";

type ImagePreviewGridProps = {
  images: string[];
  onRemove?: (index: number) => void;
  maxHeightSingle?: string; // optional customization
  className?: string;
};

export default function ImagePreviewGrid({
  images,
  onRemove,
  maxHeightSingle = "max-h-72",
  className,
}: ImagePreviewGridProps) {
  if (!images || images.length === 0) return null;

  const isSingle = images.length === 1;

  return (
    <div className={cn("mt-3 flex gap-2 flex-wrap", className)}>
      {images.map((src, i) => (
        <div
          key={i}
          className={cn(
            "relative group rounded-xl overflow-hidden border border-border shadow-sm",
            isSingle ? "w-full" : "w-[calc(50%-4px)]"
          )}
        >
          <img
            src={src}
            alt={`Preview ${i + 1}`}
            className={cn(
              "object-cover w-full",
              isSingle ? maxHeightSingle : "h-36"
            )}
          />

          {/* Remove button (optional) */}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/85 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              title="Remove"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
