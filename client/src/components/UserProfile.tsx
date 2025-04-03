import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, User, ShieldAlert } from "lucide-react";

// Usuario simulado para desarrollo
const mockUser = {
  uid: "mock-user-id",
  email: "usuario@ejemplo.com",
  displayName: "Usuario de Prueba",
  photoURL: null
};

export default function UserProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userRole] = useState<string>("admin"); // Asumimos rol de admin para desarrollo

  // Usamos el usuario simulado ya que hemos eliminado la autenticación
  const user = mockUser;

  const handleLogout = async () => {
    try {
      // Simulamos el logout
      console.log("Logout attempt");
      console.log("Logout successful");
      
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <div className="h-9 w-9 rounded-full bg-neutral-200 overflow-hidden border border-neutral-300 hover:border-primary-500 transition-colors">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar de usuario" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary-100 text-primary-600 font-medium">
              {user.email ? user.email[0].toUpperCase() : "U"}
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="pb-2">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{user.displayName || "Usuario"}</span>
              {userRole === "admin" && (
                <Badge variant="outline" className="ml-2 bg-primary-50 text-primary-700 border-primary-200">
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  Administrador
                </Badge>
              )}
            </div>
            <span className="text-xs text-neutral-500 truncate">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation("/settings/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        {userRole === "admin" && (
          <DropdownMenuItem onClick={() => setLocation("/admin")}>
            <ShieldAlert className="mr-2 h-4 w-4" />
            <span>Panel de Administración</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
