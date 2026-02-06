import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Plus, 
  Users, 
  Calendar, 
  MapPin,
  Filter,
  ArrowUpRight,
  Clock
} from "lucide-react";

const mockProposals = [
  {
    id: 1,
    title: "Community Hackathon 2025",
    description: "Join us for a 48-hour hackathon focused on building tools for local communities. All skill levels welcome!",
    author: { name: "Sarah Chen", initials: "SC" },
    category: "Event",
    location: "San Francisco, CA",
    date: "Feb 15-17, 2025",
    participants: 24,
    maxParticipants: 50,
    status: "Open",
  },
  {
    id: 2,
    title: "Open Source Design System",
    description: "Looking for collaborators to build an open-source design system for community projects. Designers and developers needed.",
    author: { name: "Marcus Johnson", initials: "MJ" },
    category: "Project",
    location: "Remote",
    date: "Ongoing",
    participants: 8,
    maxParticipants: 15,
    status: "Open",
  },
  {
    id: 3,
    title: "Monthly Networking Dinner",
    description: "Casual dinner meetup for community members to connect and share ideas. First Friday of every month.",
    author: { name: "Emily Parker", initials: "EP" },
    category: "Meetup",
    location: "New York, NY",
    date: "Mar 1, 2025",
    participants: 18,
    maxParticipants: 20,
    status: "Almost Full",
  },
  {
    id: 4,
    title: "Mentorship Program Launch",
    description: "Pairing experienced professionals with newcomers. 3-month commitment for meaningful mentorship.",
    author: { name: "David Kim", initials: "DK" },
    category: "Program",
    location: "Remote",
    date: "Apr 1, 2025",
    participants: 12,
    maxParticipants: 30,
    status: "Open",
  },
];

const categories = ["All", "Event", "Project", "Meetup", "Program"];

export default function Proposals() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Proposals</h1>
              <p className="text-muted-foreground">
                Discover and join collaborative initiatives in your community
              </p>
            </div>
            <Button variant="hero" className="gap-2 w-full md:w-auto">
              <Plus className="w-4 h-4" />
              Create Proposal
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search proposals..." className="pl-9" />
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
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="w-4 h-4" />
                More
              </Button>
            </div>
          </div>

          {/* Proposals Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {mockProposals.map((proposal) => (
              <article
                key={proposal.id}
                className="group bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge 
                    variant={proposal.status === "Open" ? "default" : "secondary"}
                    className={proposal.status === "Open" ? "bg-success text-success-foreground" : ""}
                  >
                    {proposal.status}
                  </Badge>
                  <Badge variant="outline">{proposal.category}</Badge>
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {proposal.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {proposal.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {proposal.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {proposal.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {proposal.participants}/{proposal.maxParticipants} participants
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-secondary rounded-full mb-4">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(proposal.participants / proposal.maxParticipants) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {proposal.author.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      by {proposal.author.name}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary">
                    View Details
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
