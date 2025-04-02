import { useLocation } from "wouter";
import { 
  Home, 
  Search, 
  Settings, 
  ShieldAlert 
} from "lucide-react";

export default function MobileNav() {
  const [location, setLocation] = useLocation();

  const navigateToAdmin = () => {
    setLocation("/admin");
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-10">
      <div className="flex justify-around py-2">
        <button 
          className={`flex flex-col items-center justify-center p-2 ${
            location === "/dashboard" ? "text-primary-600" : "text-neutral-500"
          }`}
          onClick={() => setLocation("/dashboard")}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Inicio</span>
        </button>
        <button className="flex flex-col items-center justify-center p-2 text-neutral-500">
          <Search className="h-5 w-5" />
          <span className="text-xs mt-1">Buscar</span>
        </button>
        <button className="flex flex-col items-center justify-center p-2 text-neutral-500">
          <Settings className="h-5 w-5" />
          <span className="text-xs mt-1">Ajustes</span>
        </button>
        <button 
          className={`flex flex-col items-center justify-center p-2 ${
            location === "/admin" ? "text-primary-600" : "text-neutral-500"
          }`}
          onClick={navigateToAdmin}
        >
          <ShieldAlert className="h-5 w-5" />
          <span className="text-xs mt-1">Admin</span>
        </button>
      </div>
    </div>
  );
}
