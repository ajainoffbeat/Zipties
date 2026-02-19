import { AppLayout } from "@/components/layout/AppLayout";
import CreatePostCard from "@/pages/Feed/CreatePostCard";
import FeedList from "@/pages/Feed/FeedList";

export default function FeedPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 mb-[18rem]">
        <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
          <div className="lg:col-span-8 space-y-6">
            <CreatePostCard />
            <FeedList />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
