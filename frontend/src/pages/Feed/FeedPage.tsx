import { AppLayout } from "@/components/layout/AppLayout";
import FeedComposer from "./FeedComposer";
import FeedList from "./FeedList.tsx";

export default function FeedPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 mb-[18rem]">
        <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
          <div className="lg:col-span-8 space-y-6">
            <FeedComposer />
            <FeedList />
          </div>

          <aside className="lg:col-span-4 space-y-6">
            {/* future widgets */}
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
