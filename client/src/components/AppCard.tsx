import { useEffect } from "react";
import { AppData } from "@/lib/types";
import { DEFAULT_ICON } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks";
import { useState } from "react";
import { doc, setDoc, deleteDoc, serverTimestamp, collection, getDoc } from "firebase/firestore";
import { getFirebaseInstances } from "@/lib/firebase-init";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AppCardProps {
  app: AppData;
}

export default function AppCard({ app }: AppCardProps) {
  const { user } = useAuth();
  const { db } = getFirebaseInstances();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verifica si esta app está en favoritos
  useEffect(() => {
    const checkIfFavorite = async () => {
      if (!user || !app.id) return;
      
      try {
        const favoriteRef = doc(collection(doc(db, "users", user.uid), "favorites"), app.id);
        const favoriteDoc = await getDoc(favoriteRef);
        
        setIsFavorite(favoriteDoc.exists());
      } catch (error) {
        console.error("Error al verificar favorito:", error);
      }
    };
    
    checkIfFavorite();
  }, [user, app.id, db]);

  const handleAppClick = async () => {
    if (user && app.id) {
      try {
        // Guardar en el historial del usuario
        const historyRef = doc(collection(doc(db, "users", user.uid), "history"), app.id);
        await setDoc(historyRef, {
          lastAccessed: serverTimestamp()
        }, { merge: true });
        
        console.log(`Aplicación ${app.name} registrada en historial`);
      } catch (error) {
        console.error("Error al registrar acceso:", error);
      }
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Evita abrir el enlace
    e.stopPropagation(); // Evita la propagación del evento
    
    if (!user || !app.id) {
      toast({
        title: "Inicio de sesión requerido",
        description: "Debes iniciar sesión para guardar favoritos",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      const favoriteRef = doc(collection(doc(db, "users", user.uid), "favorites"), app.id);
      
      if (isFavorite) {
        // Eliminar de favoritos
        await deleteDoc(favoriteRef);
        setIsFavorite(false);
        toast({
          title: "Eliminado de favoritos",
          description: `${app.name} se ha eliminado de tus favoritos`,
        });
      } else {
        // Añadir a favoritos
        await setDoc(favoriteRef, {
          addedAt: serverTimestamp()
        });
        setIsFavorite(true);
        toast({
          title: "Añadido a favoritos",
          description: `${app.name} se ha añadido a tus favoritos`,
        });
      }
    } catch (error) {
      console.error("Error al gestionar favorito:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la operación. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow h-full relative">
      <button 
        className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-colors ${
          isFavorite 
            ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200' 
            : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={toggleFavorite}
        disabled={loading}
        aria-label={isFavorite ? "Eliminar de favoritos" : "Añadir a favoritos"}
      >
        <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
      </button>
      
      <a 
        href={app.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block p-4 h-full"
        onClick={handleAppClick}
      >
        <div className="flex flex-col items-center text-center h-full">
          <img 
            src={app.icon || DEFAULT_ICON} 
            alt={app.name} 
            className="w-16 h-16 mb-3 object-contain"
            onError={(e) => (e.currentTarget.src = DEFAULT_ICON)}
          />
          <h3 className="font-medium text-neutral-800">{app.name}</h3>
          <p className="text-xs text-neutral-500 mt-1 flex-grow">{app.description || ""}</p>
        </div>
      </a>
    </Card>
  );
}
