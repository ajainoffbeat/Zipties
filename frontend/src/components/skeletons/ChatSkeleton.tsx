export const ChatSkeleton = () => {
    return (
        <div className="flex-1 p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`h-10 rounded-2xl bg-muted animate-pulse ${
                      i % 2 === 0 ? "w-2/3" : "w-1/2"
                    }`}
                  />
                </div>
              ))}
            </div>  
    )
}