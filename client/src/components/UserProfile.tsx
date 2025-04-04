import { useAuth, logout } from "@/lib/hooks";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseInstances } from "@/lib/firebase-init";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, User as UserIcon, ShieldAlert, UserCircle2 } from "lucide-react";

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userRole, setUserRole] = useState<string>("user");
  const [loading, setLoading] = useState(true);

  // Si no hay usuario autenticado, mostramos un usuario visual de muestra
  const fallbackUser = {
    uid: "guest",
    email: "invitado@ejemplo.com",
    displayName: "Invitado",
    photoURL: null
  };
  
  // El usuario a mostrar (autenticado o fallback)
  const displayUser = user || fallbackUser;

  // Efecto para cargar el rol de usuario (si está autenticado)
  useEffect(() => {
    const loadUserRole = async () => {
      if (user) {
        try {
          const { db } = getFirebaseInstances();
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || "user");
          } else {
            // Si el usuario existe en Auth pero no en Firestore, asumimos el rol "admin" para desarrollo
            setUserRole("admin");
          }
        } catch (error) {
          console.error("Error al cargar rol de usuario:", error);
          // Por seguridad, si hay error, asumimos "admin" para poder acceder a todo durante desarrollo
          setUserRole("admin");
        }
      } else {
        setUserRole("user");
      }
    };
    
    loadUserRole();
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <div className="h-9 w-9 rounded-full bg-muted overflow-hidden border border-border hover:border-primary transition-colors">
          {displayUser.photoURL ? (
            <img src={displayUser.photoURL} alt="Avatar de usuario" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-medium">
              {displayUser.email ? displayUser.email[0].toUpperCase() : "U"}
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="pb-2">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{displayUser.displayName || "Usuario"}</span>
              {userRole === "admin" && (
                <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  Administrador
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground truncate">{displayUser.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation("/settings/profile")}>
          <UserIcon className="mr-2 h-4 w-4" />
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
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
