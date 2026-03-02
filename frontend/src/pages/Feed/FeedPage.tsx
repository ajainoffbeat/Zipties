import { AppLayout } from "@/components/layout/AppLayout";
import CreatePostCard from "@/pages/Feed/CreatePostCard";
import FeedList from "@/pages/Feed/FeedList";
import { PostSearch } from "@/components/search/PostSearch";
import { CityFilter } from "@/pages/Feed/CityFilter";
import { useState } from "react";

export default function FeedPage() {
  const [isSearchActive, setIsSearchActive] = useState(false);

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
            <CityFilter />
          </div>
        </div>

        {!isSearchActive && (
          <FeedList />
        )}


      </div>
    </AppLayout>
  );
}