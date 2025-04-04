import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Menu, Search, Bell } from "lucide-react";
import UserProfile from "@/components/UserProfile";

interface TopbarProps {
  toggleMobileMenu: () => void;
  showSearch?: boolean;
}

export default function Topbar({ toggleMobileMenu, showSearch = true }: TopbarProps) {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() && location !== "/search") {
      setLocation(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="container mx-auto py-3 px-4">
        <div className="flex items-center justify-between">
          {/* Left side - Mobile menu toggle and logo */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-primary md:hidden">AppHub</h1>
          </div>

          {/* Center - Search bar */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <form className="w-full" onSubmit={handleSearch}>
                <div className="relative">
                  <Input
                    type="text"
                    className="w-full pl-9 h-9"
                    placeholder="Buscar aplicaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </form>
            </div>
          )}

          {/* Right side - Notifications and User profile */}
          <div className="flex items-center space-x-3">
            {showSearch && (
              <div className="relative md:hidden">
                <Input
                  type="text"
                  className="w-32 pl-8 h-9"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="h-4 w-4 text-muted-foreground absolute left-2 top-1/2 transform -translate-y-1/2" />
              </div>
            )}
            
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            
            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
}