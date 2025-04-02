import { useState, useEffect } from "react";
import { Clock, History } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import AppCard from "@/components/AppCard";
import { useAuth } from "@/lib/hooks";
import { AppData } from "@/lib/types";

export default function Recent() {
  const [recentApps, setRecentApps] = useState<AppData[]>([]);
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

  // Para desarrollo, datos simulados de apps recientes con un timestamp
  const mockRecentApps: (AppData & {lastAccessed: number})[] = [
    {
      id: "app1",
      name: "Google Workspace",
      icon: "https://www.gstatic.com/images/branding/product/2x/hh_drive_96dp.png",
      url: "https://workspace.google.com/",
      description: "Suite de herramientas de productividad: Gmail, Drive, Docs, Calendar",
      lastAccessed: Date.now() - 1000 * 60 * 5 // 5 minutos atrás
    },
    {
      id: "app2",
      name: "Microsoft 365",
      icon: "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31",
      url: "https://www.microsoft.com/microsoft-365",
      description: "Aplicaciones de Office en la nube: Word, Excel, PowerPoint, Teams",
      lastAccessed: Date.now() - 1000 * 60 * 30 // 30 minutos atrás
    },
    {
      id: "app5",
      name: "Canva",
      icon: "https://static.canva.com/static/images/canva-logo-blue.svg",
      url: "https://canva.com/",
      description: "Plataforma de diseño gráfico y composición de imágenes",
      lastAccessed: Date.now() - 1000 * 60 * 60 // 1 hora atrás
    },
    {
      id: "app6",
      name: "GitHub",
      icon: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png",
      url: "https://github.com/",
      description: "Plataforma de desarrollo colaborativo basado en Git",
      lastAccessed: Date.now() - 1000 * 60 * 60 * 3 // 3 horas atrás
    }
  ];

  useEffect(() => {
    // En un caso real, cargaríamos el historial desde Firestore
    // collection('users').doc(effectiveUser.uid).collection('history').orderBy('lastAccessed', 'desc').limit(10).get()
    
    // Simulamos carga con un retraso
    setTimeout(() => {
      // Ordenamos por último acceso, más reciente primero
      const sortedApps = [...mockRecentApps].sort((a, b) => b.lastAccessed - a.lastAccessed);
      // Eliminamos la propiedad lastAccessed para ajustarse al tipo AppData
      setRecentApps(sortedApps.map(({lastAccessed, ...app}) => app));
      setIsLoading(false);
    }, 1000);
  }, [effectiveUser.uid]);
  
  // Función para formatear tiempo relativo
  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `Hace ${interval} años`;
    if (interval === 1) return `Hace 1 año`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `Hace ${interval} meses`;
    if (interval === 1) return `Hace 1 mes`;
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return `Hace ${interval} días`;
    if (interval === 1) return `Hace 1 día`;
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return `Hace ${interval} horas`;
    if (interval === 1) return `Hace 1 hora`;
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return `Hace ${interval} minutos`;
    if (interval === 1) return `Hace 1 minuto`;
    
    return "Hace menos de un minuto";
  };

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
            <h1 className="text-2xl font-bold text-neutral-800">Recientes</h1>
          </div>
        </header>
        
        {/* Recent Content */}
        <main className="flex-1 p-4 md:p-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {[...Array(4)].map((_, i) => (
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
              {recentApps.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-neutral-800 mb-2">Último día</h2>
                
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                    {recentApps.map(app => (
                      <AppCard key={app.id} app={app} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 mb-4 text-neutral-300">
                    <History className="w-full h-full" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-700">No hay actividad reciente</h3>
                  <p className="text-neutral-500 mt-2">Las aplicaciones que uses aparecerán aquí</p>
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