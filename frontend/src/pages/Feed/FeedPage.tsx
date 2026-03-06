import { AppLayout } from "@/components/layout/AppLayout";
import CreatePostCard from "@/components/CreatePost/CreatePostCard";
import FeedList from "@/components/PostList/FeedList";
import { PostSearch } from "@/components/search/PostSearch";
import { CityFilter } from "@/components/CityDropdown/CityFilter";
import { useState } from "react";
import { usePostStore } from "@/store/usePostStore";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function FeedPage() {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { selectedCity, setSelectedCity } = usePostStore();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Create Post */}
        <div className="mb-6">
          <CreatePostCard />
        </div>

        {/* Search + Filter Row */}
        <div className="flex flex-col md:flex-row gap-4 mb-2 ">
          <div className="mb-6 w-[80%]">
            <PostSearch isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive} />
          </div>

          <div className="md:w-60">
            <CityFilter
              value={selectedCity}
              placeholder={selectedCity || "Filter posts by city"}
              width="w-[240px]"
              onSelect={(city) => {
                setSelectedCity(city.name);
              }}
            />
          </div>
          {selectedCity && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCity("")}
              className="text-muted-foreground hover:text-white"
              title="Clear filter"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {!isSearchActive && (
          <FeedList />
        )}


      </div>
    </AppLayout>
  );
}