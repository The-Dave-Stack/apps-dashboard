import { useLocation } from "wouter";
import { 
  Home, 
  Search, 
  Star,
  Clock,
  Settings, 
  ShieldAlert 
} from "lucide-react";
import { useAuth } from "@/lib/hooks";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MobileNav() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Comprobar rol de administrador desde Firestore
  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        try {
          // Intentamos obtener los datos del usuario desde Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Si el usuario tiene rol de administrador
            setIsAdmin(userData.role === "admin");
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error al verificar el rol de administrador:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    
    checkAdminRole();
  }, [user]);

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
            location === "/recent" ? "text-primary-600" : "text-neutral-500"
          }`}
          onClick={() => setLocation("/recent")}
        >
          <Clock className="h-5 w-5" />
          <span className="text-xs mt-1">Recientes</span>
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
