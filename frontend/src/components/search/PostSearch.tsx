import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePostStore } from "@/store/usePostStore";
import { cn } from "@/lib/utils/utils";

// Dynamic import to avoid circular dependency
const FeedPost = lazy(() => import("@/pages/Feed/FeedPost").then(module => ({ default: module.default })));

export function PostSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    searchPosts, 
    searchResults, 
    isSearching, 
    searchPagination, 
    clearSearch,
    searchQuery: storeSearchQuery 
  } = usePostStore();

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      clearSearch();
      setIsSearchActive(false);
      return;
    }
    
    setIsSearchActive(true);
    await searchPosts(query.trim(), true);
  }, [searchPosts, clearSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    clearSearch();
    setIsSearchActive(false);
    inputRef.current?.blur();
  };

  const loadMoreSearchResults = async () => {
    if (searchPagination.hasMore && !isSearching) {
      await searchPosts(storeSearchQuery, false);
    }
  };

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = element;
    
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadMoreSearchResults();
    }
  }, [loadMoreSearchResults]);

  return (
    <>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search posts by content..."
          value={searchQuery}
          onChange={handleInputChange}
          className={cn(
            "pl-10 pr-10 transition-all duration-200",
            isSearchActive && "ring-2 ring-primary/20"
          )}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Results in Feed */}
      {isSearchActive && (
        <div className="mt-6">
          {/* Search Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Search Results</h2>
              <span className="text-sm text-muted-foreground">
                {searchResults.length} {searchResults.length === 1 ? 'post' : 'posts'} found
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>

          {/* Results Content */}
          {isSearching && searchResults.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Searching posts...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div 
              className="space-y-6"
              onScroll={handleScroll}
            >
              {searchResults.map((post) => (
                <Suspense key={post.postId} fallback={<div className="animate-pulse bg-muted h-64 rounded-lg" />}>
                  <FeedPost post={post} />
                </Suspense>
              ))}
              
              {/* Load More */}
              {searchPagination.hasMore && (
                <div className="text-center py-6">
                  {isSearching ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading more results...</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={loadMoreSearchResults}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Load more posts
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Search className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                No posts match "{searchQuery}". Try searching with different keywords.
              </p>
              <Button
                variant="outline"
                onClick={handleClearSearch}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear search
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
