import { useLocation } from "wouter";
import { useAuth } from "@/lib/hooks";
import { logout } from "@/lib/hooks";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Search, 
  Star, 
  Clock, 
  ShieldAlert, 
  Settings,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      setLocation("/auth");
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const navigateToAdmin = () => {
    setLocation("/admin");
  };

  return (
    <div className="hidden md:flex md:flex-col md:w-64 bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">AppHub</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          <li>
            <Button 
              variant={location === "/" ? "secondary" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setLocation("/")}
            >
              <Home className="mr-3 h-5 w-5" />
              <span>Dashboard</span>
            </Button>
          </li>
          <li>
            <Button 
              variant={location === "/search" ? "secondary" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setLocation("/search")}
            >
              <Search className="mr-3 h-5 w-5" />
              <span>Buscar</span>
            </Button>
          </li>
          <li>
            <Button 
              variant={location === "/favorites" ? "secondary" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setLocation("/favorites")}
            >
              <Star className="mr-3 h-5 w-5" />
              <span>Favoritos</span>
            </Button>
          </li>
          <li>
            <Button 
              variant={location === "/recent" ? "secondary" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setLocation("/recent")}
            >
              <Clock className="mr-3 h-5 w-5" />
              <span>Recientes</span>
            </Button>
          </li>
          
          <li className="pt-6 mt-6 border-t border-border">
            <Button 
              variant={location === "/admin" ? "secondary" : "ghost"} 
              className="w-full justify-start"
              onClick={navigateToAdmin}
            >
              <ShieldAlert className="mr-3 h-5 w-5" />
              <span>Panel de Administración</span>
            </Button>
          </li>
          
          <li>
            <Button 
              variant={location === "/settings" ? "secondary" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setLocation("/settings")}
            >
              <Settings className="mr-3 h-5 w-5" />
              <span>Configuración</span>
            </Button>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                {user?.email ? user.email[0].toUpperCase() : "U"}
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-card-foreground">
              {user?.displayName || user?.email || "Usuario"}
            </p>
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs text-muted-foreground hover:text-primary p-0 h-auto"
              onClick={handleLogout}
            >
              <LogOut className="h-3 w-3 mr-1" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
