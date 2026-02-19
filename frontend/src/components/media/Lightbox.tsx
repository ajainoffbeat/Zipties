import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type LightboxProps = {
  images: string[];
  index: number;
  onClose: () => void;
  onChange: (index: number) => void;
};

export function Lightbox({
  images,
  index,
  onClose,
  onChange,
}: LightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
        {index + 1} / {images.length}
      </div>

      {/* Image */}
      <img
        src={images[index]}
        alt="Full view"
        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Prev */}
      {index > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onChange(index - 1);
          }}
        >
          ‹
        </button>
      )}

      {/* Next */}
      {index < images.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onChange(index + 1);
          }}
        >
          ›
        </button>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((thumb, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onChange(i);
              }}
              className={cn(
                "w-10 h-10 rounded-md overflow-hidden border-2 transition-all",
                i === index
                  ? "border-white scale-110"
                  : "border-white/30 opacity-60 hover:opacity-90"
              )}
            >
              <img
                src={thumb}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
