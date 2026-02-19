import { useState } from "react";
import { cn } from "@/lib/utils";
import { Lightbox } from "@/components/media/Lightbox";

type PostMediaGridProps = {
  images: string[];
  maxVisible?: number;
  className?: string;
};

export default function PostMediaGrid({
  images,
  maxVisible = 4,
  className,
}: PostMediaGridProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const visible = images.slice(0, maxVisible);
  const overflow = images.length - maxVisible;

  const gridClass =
    images.length === 1
      ? "grid-cols-1"
      : images.length === 2
      ? "grid-cols-2"
      : images.length === 3
      ? "grid-cols-3"
      : "grid-cols-2";

  return (
    <>
      {/* Grid */}
      <div
        className={cn(
          "grid gap-0.5 bg-muted overflow-hidden",
          gridClass,
          className
        )}
      >
        {visible.map((src, i) => {
          const isLast = i === maxVisible - 1 && overflow > 0;
          const spanFull = images.length === 3 && i === 0;

          return (
            <div
              key={i}
              className={cn(
                "relative overflow-hidden cursor-pointer group",
                spanFull && "row-span-2",
                images.length === 1 ? "aspect-[16/9]" : "aspect-square"
              )}
              onClick={() => setLightbox(i)}
            >
              <img
                src={src}
                alt={`Post image ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

              {isLast && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="text-white text-2xl font-bold">
                    +{overflow + 1}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox
          images={images}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onChange={setLightbox}
        />
      )}
    </>
  );
}
