import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Filter,
  Grid3X3,
  List,
  Heart,
  MessageCircle,
  MapPin
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mockListings = [
  {
    id: 1,
    title: "Vintage Camera Collection",
    description: "Beautiful set of vintage film cameras from the 70s. All in working condition.",
    price: 450,
    image: null,
    category: "Electronics",
    location: "Brooklyn, NY",
    seller: { name: "Alex Rivera", initials: "AR" },
    timeAgo: "2h",
    likes: 12,
    condition: "Excellent",
  },
  {
    id: 2,
    title: "Handmade Ceramic Planters",
    description: "Set of 3 handcrafted ceramic planters. Perfect for indoor plants.",
    price: 85,
    image: null,
    category: "Home & Garden",
    location: "Portland, OR",
    seller: { name: "Jordan Lee", initials: "JL" },
    timeAgo: "5h",
    likes: 28,
    condition: "New",
  },
  {
    id: 3,
    title: "Standing Desk - Adjustable",
    description: "Electric standing desk, excellent condition. Height adjustable from 28\" to 48\".",
    price: 320,
    image: null,
    category: "Furniture",
    location: "San Francisco, CA",
    seller: { name: "Taylor Kim", initials: "TK" },
    timeAgo: "1d",
    likes: 45,
    condition: "Like New",
  },
  {
    id: 4,
    title: "Rare Vinyl Records Bundle",
    description: "Collection of 20 rare vinyl records. Jazz and Soul classics from the 60s.",
    price: 180,
    image: null,
    category: "Music",
    location: "Austin, TX",
    seller: { name: "Chris Morgan", initials: "CM" },
    timeAgo: "2d",
    likes: 67,
    condition: "Good",
  },
  {
    id: 5,
    title: "Professional Art Supplies",
    description: "Complete set of professional-grade art supplies. Paints, brushes, and easel.",
    price: 275,
    image: null,
    category: "Art",
    location: "Los Angeles, CA",
    seller: { name: "Sam Wilson", initials: "SW" },
    timeAgo: "3d",
    likes: 23,
    condition: "New",
  },
  {
    id: 6,
    title: "Mechanical Keyboard Set",
    description: "Custom mechanical keyboard with Cherry MX switches. RGB backlight.",
    price: 165,
    image: null,
    category: "Electronics",
    location: "Seattle, WA",
    seller: { name: "Jamie Park", initials: "JP" },
    timeAgo: "4h",
    likes: 34,
    condition: "Excellent",
  },
];

const categories = ["All", "Electronics", "Furniture", "Home & Garden", "Art", "Music"];

export default function Marketplace() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [likedItems, setLikedItems] = useState<number[]>([]);

  const toggleLike = (id: number) => {
    setLikedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Marketplace</h1>
              <p className="text-muted-foreground">
                Discover unique items from community members
              </p>
            </div>
            <Button variant="hero" className="gap-2 w-full md:w-auto">
              <Plus className="w-4 h-4" />
              Create Listing
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search marketplace..." className="pl-9" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={cat === "All" ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {cat}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="rounded-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="rounded-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className={cn(
            "grid gap-6",
            viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {mockListings.map((listing) => (
              <article
                key={listing.id}
                className={cn(
                  "group bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300",
                  viewMode === "list" && "flex"
                )}
              >
                {/* Image Placeholder */}
                <div className={cn(
                  "bg-gradient-subtle flex items-center justify-center",
                  viewMode === "grid" ? "aspect-square" : "w-48 h-48 flex-shrink-0"
                )}>
                  <div className="text-center p-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl">{listing.category === "Electronics" ? "📷" : listing.category === "Furniture" ? "🪑" : listing.category === "Music" ? "🎵" : "🎨"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">No image</span>
                  </div>
                </div>

                <div className={cn("p-5", viewMode === "list" && "flex-1")}>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {listing.category}
                    </Badge>
                    <button
                      onClick={() => toggleLike(listing.id)}
                      className="text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Heart className={cn(
                        "w-5 h-5",
                        likedItems.includes(listing.id) && "fill-accent text-accent"
                      )} />
                    </button>
                  </div>

                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {listing.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {listing.location}
                    <span className="mx-1">•</span>
                    <Badge variant="secondary" className="text-xs">
                      {listing.condition}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      ${listing.price}
                    </span>
                    <Button variant="outline" size="sm" className="gap-1">
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
