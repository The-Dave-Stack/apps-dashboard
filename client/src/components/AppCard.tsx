/**
 * @fileoverview Componente AppCard - Tarjeta de aplicación reutilizable
 * Este componente renderiza una tarjeta individual para cada aplicación,
 * incluyendo funcionalidades para marcar como favorito y registrar accesos.
 * @module components/AppCard
 */

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

/**
 * Props para el componente AppCard
 * @interface AppCardProps
 * @property {AppData} app - Datos de la aplicación a mostrar
 */
interface AppCardProps {
  app: AppData;
}

/**
 * Componente que muestra una tarjeta de aplicación con funcionalidad para
 * marcar como favorito y registrar historial de uso.
 *
 * @component
 * @param {AppCardProps} props - Propiedades del componente
 * @returns {JSX.Element} Componente AppCard renderizado
 */
export default function AppCard({ app }: AppCardProps) {
  const { user } = useAuth();
  const { db } = getFirebaseInstances();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * Efecto para verificar si la aplicación está en favoritos del usuario actual
   */
  useEffect(() => {
    /**
     * Consulta Firestore para verificar si esta app está marcada como favorita
     * @async
     */
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

  /**
   * Registra el acceso del usuario a una aplicación en Firestore
   * @async
   */
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

  /**
   * Alterna el estado de favorito de una aplicación
   * @async
   * @param {React.MouseEvent} e - Evento del click
   */
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
    <Card className="bg-card rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow h-full relative">
      <button 
        className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-colors ${
          isFavorite 
            ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' 
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
          <h3 className="font-medium text-card-foreground">{app.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 flex-grow">{app.description || ""}</p>
        </div>
      </a>
    </Card>
  );
}
