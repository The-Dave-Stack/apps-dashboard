import { useAuth } from "@/lib/hooks";
import { logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userRole, setUserRole] = useState<string>("user");
  const [loading, setLoading] = useState(true);

  // Obtener datos adicionales del usuario desde Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          setLoading(true);
          // Intentamos obtener los datos del usuario desde Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || "user");
          }
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
  }, [user]);

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

  if (!user) return null;

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
