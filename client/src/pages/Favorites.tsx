import { useState, useEffect } from "react";
import { Star, Plus } from "lucide-react";
import AppCard from "@/components/AppCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks";
import { AppData } from "@/lib/types";
import { getFirebaseInstances } from "@/lib/firebase-init";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { fetchCategories } from "@/lib/firebase";

export default function Favorites() {
  const [favorites, setFavorites] = useState<AppData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { db } = getFirebaseInstances();

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Intentar cargar las referencias a favoritos del usuario
        const userFavoritesRef = collection(doc(db, "users", user.uid), "favorites");
        const favoritesSnapshot = await getDocs(userFavoritesRef);

        if (favoritesSnapshot.empty) {
          setFavorites([]);
          setIsLoading(false);
          return;
        }

        // Obtener todas las categorías para buscar apps favoritas
        const categories = await fetchCategories();
        const allApps: AppData[] = [];
        
        // Reunir todas las apps de todas las categorías
        categories.forEach(category => {
          category.apps.forEach(app => {
            allApps.push(app);
          });
        });

        // Filtrar solo las apps favoritas
        const favoriteIds = favoritesSnapshot.docs.map(doc => doc.id);
        const userFavorites = allApps.filter(app => app.id && favoriteIds.includes(app.id));
        
        setFavorites(userFavorites);
      } catch (error) {
        console.error("Error al cargar favoritos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar tus aplicaciones favoritas",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [user, db, toast]);

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-600">Favoritos</h1>
        <p className="text-neutral-500 mt-1">Accede rápidamente a tus aplicaciones favoritas</p>
      </div>
      
      {/* Favorites Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 h-48 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-neutral-200 mb-3"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-neutral-100 rounded w-full"></div>
                <div className="h-3 bg-neutral-100 rounded w-2/3 mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {favorites.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {favorites.map(app => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-neutral-200">
              <div className="mx-auto w-16 h-16 mb-4 text-neutral-300">
                <Star className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-neutral-700">No tienes favoritos</h3>
              <p className="text-neutral-500 mt-2">Agrega aplicaciones a tus favoritos para verlas aquí</p>
              <Button className="mt-6">
                <Plus className="h-4 w-4 mr-2" />
                Agregar favoritos
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}