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

export default function MobileNav() {
  const [location, setLocation] = useLocation();
  // Usamos un valor fijo de administrador para desarrollo
  const isAdmin = true;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10">
      <div className="flex justify-around py-2">
        <button 
          className={`flex flex-col items-center justify-center p-2 ${
            location === "/" ? "text-primary-600" : "text-neutral-500"
          }`}
          onClick={() => setLocation("/")}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Inicio</span>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center p-2 ${
            location === "/search" ? "text-primary-600" : "text-neutral-500"
          }`}
          onClick={() => setLocation("/search")}
        >
          <Search className="h-5 w-5" />
          <span className="text-xs mt-1">Buscar</span>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center p-2 ${
            location === "/favorites" ? "text-primary-600" : "text-neutral-500"
          }`}
          onClick={() => setLocation("/favorites")}
        >
          <Star className="h-5 w-5" />
          <span className="text-xs mt-1">Favoritos</span>
        </button>
        
        <button 
          className={`flex flex-col items-center justify-center p-2 ${
            location === "/settings" ? "text-primary-600" : "text-neutral-500"
          }`}
          onClick={() => setLocation("/settings")}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs mt-1">Ajustes</span>
        </button>
        
        {isAdmin && (
          <button 
            className={`flex flex-col items-center justify-center p-2 ${
              location === "/admin" ? "text-primary-600" : "text-neutral-500"
            }`}
            onClick={() => setLocation("/admin")}
          >
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs mt-1">Admin</span>
          </button>
        )}
      </div>
    </div>
  );
}
