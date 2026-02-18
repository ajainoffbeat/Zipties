export const MessagesSkeleton = () => {
  return (
    <div className="container mx-auto px-0 md:px-4 py-0 md:py-1">
      <div className="max-w-6xl mx-auto bg-card md:rounded-2xl border border-border shadow-sm h-[calc(100vh-2rem)] md:h-[calc(100vh-8rem)] overflow-hidden">
        <div className="flex h-full">

          {/* Conversations Skeleton */}
          <div className="w-full md:w-80 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
            </div>

            <div className="flex-1 overflow-y-auto">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 border-b border-border/50"
                >
                  <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-full bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Skeleton */}
          {/* <div className="hidden md:flex flex-1 flex-col">

            {/* Header */}
            {/* <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              </div>
            </div> */}

            {/* Messages */}
         

            {/* Input */}
            {/* <div className="p-4 border-t border-border">
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>

          </div> */}
        </div>
      </div>
    </div>
  );
};
