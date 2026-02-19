import { cn } from "@/lib/utils/utils";

type PostSkeletonProps = {
  showImage?: boolean;
  lines?: number;
  className?: string;
};

export default function PostSkeleton({
  showImage = true,
  lines = 3,
  className,
}: PostSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl border border-border p-5 shadow-sm animate-pulse space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-1/5" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 bg-muted rounded",
              i === lines - 1 ? "w-2/3" : "w-full"
            )}
          />
        ))}
      </div>

      {/* Media */}
      {showImage && (
        <div className="h-48 bg-muted rounded-xl" />
      )}
    </div>
  );
}
