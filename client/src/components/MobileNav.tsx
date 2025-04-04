import { useLocation } from "wouter";
import { 
  Home, 
  Search, 
  Star,
  Clock,
  Settings, 
  ShieldAlert,
  UserCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MobileNav() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  // Usamos un valor fijo de administrador para desarrollo
  const isAdmin = true;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-10">
      <div className="flex justify-around py-2">
        <button 
          className={`flex flex-col items-center justify-center p-2 ${
            location === "/" ? "text-primary" : "text-muted-foreground"
          }`}
          onClick={() => setLocation("/")}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">{t("navigation.home")}</span>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center p-2 ${
            location === "/search" ? "text-primary" : "text-muted-foreground"
          }`}
          onClick={() => setLocation("/search")}
        >
          <Search className="h-5 w-5" />
          <span className="text-xs mt-1">{t("navigation.search")}</span>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center p-2 ${
            location === "/favorites" ? "text-primary" : "text-muted-foreground"
          }`}
          onClick={() => setLocation("/favorites")}
        >
          <Star className="h-5 w-5" />
          <span className="text-xs mt-1">{t("navigation.favorites")}</span>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center p-2 ${
            location === "/settings" ? "text-primary" : "text-muted-foreground"
          }`}
          onClick={() => setLocation("/settings")}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs mt-1">{t("navigation.settings")}</span>
        </button>
        
        {isAdmin && (
          <button 
            className={`flex flex-col items-center justify-center p-2 ${
              location === "/admin" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => setLocation("/admin")}
          >
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs mt-1">{t("navigation.admin_short")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
