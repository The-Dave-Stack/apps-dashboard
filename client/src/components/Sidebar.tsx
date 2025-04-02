import { useLocation } from "wouter";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/lib/hooks";
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
  
  // Usuario simulado para el desarrollo (temporal)
  const mockUser = {
    uid: "mock-user-id",
    email: "usuario@ejemplo.com",
    displayName: "Usuario de Prueba",
    photoURL: null
  };
  
  // Durante el desarrollo, usamos el usuario simulado si no hay usuario autenticado
  const effectiveUser = user || mockUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      setLocation("/");
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
    <div className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-neutral-200">
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-2xl font-bold text-primary-600">AppHub</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          <li>
            <Button 
              variant={location === "/dashboard" ? "secondary" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setLocation("/dashboard")}
            >
              <Home className="mr-3 h-5 w-5" />
              <span>Dashboard</span>
            </Button>
          </li>
          <li>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Search className="mr-3 h-5 w-5" />
              <span>Buscar</span>
            </Button>
          </li>
          <li>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Star className="mr-3 h-5 w-5" />
              <span>Favoritos</span>
            </Button>
          </li>
          <li>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Clock className="mr-3 h-5 w-5" />
              <span>Recientes</span>
            </Button>
          </li>
          
          <li className="pt-6 mt-6 border-t border-neutral-200">
            <Button 
              variant={location === "/admin" ? "secondary" : "ghost"} 
              className="w-full justify-start text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              onClick={navigateToAdmin}
            >
              <ShieldAlert className="mr-3 h-5 w-5" />
              <span>Panel de Administración</span>
            </Button>
          </li>
          
          <li>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Settings className="mr-3 h-5 w-5" />
              <span>Configuración</span>
            </Button>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-neutral-300 overflow-hidden">
            {effectiveUser?.photoURL ? (
              <img src={effectiveUser.photoURL} alt="User avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary-100 text-primary-600">
                {effectiveUser?.email ? effectiveUser.email[0].toUpperCase() : "U"}
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-800">
              {effectiveUser?.displayName || effectiveUser?.email || "User"}
            </p>
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs text-neutral-500 hover:text-primary-600 p-0 h-auto"
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
