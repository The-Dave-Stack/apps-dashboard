import { useState, useEffect } from "react";
import { Star, Plus } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import AppCard from "@/components/AppCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks";
import { AppData } from "@/lib/types";

export default function Favorites() {
  const [favorites, setFavorites] = useState<AppData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Usuario simulado para el desarrollo (temporal)
  const mockUser = {
    uid: "mock-user-id",
    email: "usuario@ejemplo.com",
    displayName: "Usuario de Prueba",
    photoURL: null
  };

  // Durante el desarrollo, usamos el usuario simulado si no hay usuario autenticado
  const effectiveUser = user || mockUser;

  // Para desarrollo, datos simulados de favoritos
  const mockFavorites: AppData[] = [
    {
      id: "app1",
      name: "Google Workspace",
      icon: "https://www.gstatic.com/images/branding/product/2x/hh_drive_96dp.png",
      url: "https://workspace.google.com/",
      description: "Suite de herramientas de productividad: Gmail, Drive, Docs, Calendar"
    },
    {
      id: "app6",
      name: "GitHub",
      icon: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png",
      url: "https://github.com/",
      description: "Plataforma de desarrollo colaborativo basado en Git"
    },
    {
      id: "app7",
      name: "Replit",
      icon: "https://replit.com/cdn-cgi/image/width=64,quality=80/https://storage.googleapis.com/replit/images/1664475603315_1442b3c69cc612aff6ef60cce0c69328.png",
      url: "https://replit.com/",
      description: "Entorno de desarrollo integrado en la nube"
    }
  ];

  useEffect(() => {
    // En un caso real, cargaríamos los favoritos desde Firestore
    // collection('users').doc(effectiveUser.uid).collection('favorites').get()
    
    // Simulamos carga con un retraso
    setTimeout(() => {
      setFavorites(mockFavorites);
      setIsLoading(false);
    }, 1000);
  }, [effectiveUser.uid]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for larger screens */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">AppHub</h1>
        </header>
        
        {/* Desktop Header */}
        <header className="bg-white border-b border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-800">Favoritos</h1>
            <Button variant="outline" size="sm" className="text-neutral-700">
              <Plus className="h-4 w-4 mr-2" />
              Agregar aplicación
            </Button>
          </div>
        </header>
        
        {/* Favorites Content */}
        <main className="flex-1 p-4 md:p-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                  {favorites.map(app => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
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
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}