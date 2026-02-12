import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  MessageCircle,
  Users,
  ShoppingBag,
  User,
  Menu,
  X,
  Sparkles,
  Search
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { removeCookie } from "@/utils/cookies";
import logo2 from "@/assets/logo.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchUsers } from "@/lib/api/auth.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { debounce } from "lodash";

const navItems = [
  { path: "/feed", label: "Feed", icon: Home },
  { label: "Proposals", icon: Users },
  { label: "Marketplace", icon: ShoppingBag },
  { path: "/messages", label: "Messages", icon: MessageCircle },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await searchUsers(query);
        setSearchResults(res.data.data || []);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  const handleUserClick = (id: string) => {
    setSearchQuery("");
    navigate(`/profile/${id}`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/feed" className="flex items-center gap-2 group">
            <img src={logo2} className="w-10 h-10" alt="" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "gap-2",
                      isActive && "bg-primary/10 text-primary"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Instagram style expandable search */}
            <div className="relative flex items-center group">
              <div className={cn(
                "flex items-center bg-secondary/50 rounded-full transition-all duration-300 overflow-hidden",
                searchOpen ? "w-64 px-4 border border-primary/30 ring-2 ring-primary/5" : "w-10 px-0"
              )}>
                <Search className={cn(
                  "w-5 h-5 text-muted-foreground shrink-0 transition-colors",
                  searchOpen && "text-primary"
                )} />
                <input
                  type="text"
                  placeholder="Search..."
                  className={cn(
                    "bg-transparent border-none focus:ring-0 text-sm h-10 w-full transition-all duration-300 outline-none ml-2",
                    !searchOpen && "w-0 opacity-0 pointer-events-none"
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <X
                    className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                    onClick={() => setSearchQuery("")}
                  />
                )}
              </div>

              {!searchOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full absolute inset-0"

                >
                  {/* <Search className="w-5 h-5" /> */}
                </Button>
              )}

              {/* Real-time search results dropdown */}
              {searchOpen && searchQuery.trim() !== "" && (
                <div className="absolute top-full mt-2 left-0 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="max-h-[400px] overflow-y-auto py-2">
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary mx-auto" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-secondary cursor-pointer transition-colors"
                          onClick={() => handleUserClick(user.id)}
                        >
                          <Avatar className="w-10 h-10 border border-border">
                            <AvatarImage src={`http://localhost:5000${user.profile_image_url}`} />
                            <AvatarFallback className="bg-primary/5 text-primary">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.username}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No users found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="hero" size="sm" onClick={() => {
              removeCookie("token");
              navigate("/");
            }}>
              Log Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive && "bg-primary/10 text-primary"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Link to="/profile" className="flex-1">
                  {/* <Button variant="outline" className="w-full gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Button> */}
                </Link>
                <Link to="/" className="flex-1">
                  <Button variant="hero" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
