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
  Search,
  LogOut,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
// import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { removeCookie } from "@/utils/cookies";
import logo2 from "@/assets/logo.png";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
import { searchUsers } from "@/lib/api/user.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { debounce } from "lodash";
import { useTotalUnreadCount } from "@/store/useInboxStore";
// import { Badge } from "@/components/ui/badge";
import { useProfileStore } from "@/store/useProfileStore";
import { useAuthStore } from "@/store/authStore";


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
  const unreadCount = useTotalUnreadCount();
  const { profile, fetchMyProfile } = useProfileStore();
  const logout = useAuthStore((s) => s.logout);
  const userId = useAuthStore((s) => s.userId);
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
    if (userId) {
      fetchMyProfile(userId);
    }
  }, [userId, fetchMyProfile]);


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
              const isMessages = item.label === "Messages";
              return (
                <Link key={item.path} to={item.path || "#"}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "gap-2 relative",
                      isActive && "bg-primary/10 text-primary"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                    {isMessages && unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background shadow-sm animate-pulse" />
                    )}
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
                            <AvatarImage src={`${user.profile_image_url}`} />
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden ring-offset-background transition-all hover:ring-2 hover:ring-primary/20">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={profile?.profile_image_url} />
                    <AvatarFallback className="bg-primary/5 text-primary font-medium">
                      {(profile?.first_name?.[0] || "") + (profile?.last_name?.[0] || "") || <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.username}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer ">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-white cursor-pointer"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                const isMessages = item.label === "Messages";
                return (
                  <Link
                    key={item.path}
                    to={item.path || "#"}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 relative",
                        isActive && "bg-primary/10 text-primary"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                      {isMessages && unreadCount > 0 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm" />
                      )}
                    </Button>
                  </Link>
                );
              })}
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="w-full justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border border-border">
                          <AvatarImage src={profile?.profile_image_url} />
                          <AvatarFallback className="text-[10px]">
                            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>Account</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[calc(100vw-2.5rem)]" align="start">
                    <DropdownMenuItem onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/profile");
                    }}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                        navigate("/");
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
