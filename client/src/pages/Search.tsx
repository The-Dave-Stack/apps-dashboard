import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import AppCard from "@/components/AppCard";
import { useAuth } from "@/lib/hooks";
import { AppData, CategoryData } from "@/lib/types";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AppData[]>([]);
  const [allApps, setAllApps] = useState<AppData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Usuario simulado para el desarrollo (temporal)
  const mockUser = {
    uid: "mock-user-id",
    email: "usuario@ejemplo.com",
    displayName: "Usuario de Prueba",
    photoURL: null
  };

  // Datos de ejemplo para desarrollo
  const mockCategories: CategoryData[] = [
    {
      id: "cat1",
      name: "Productividad",
      apps: [
        {
          id: "app1",
          name: "Google Workspace",
          icon: "https://www.gstatic.com/images/branding/product/2x/hh_drive_96dp.png",
          url: "https://workspace.google.com/",
          description: "Suite de herramientas de productividad: Gmail, Drive, Docs, Calendar"
        },
        {
          id: "app2",
          name: "Microsoft 365",
          icon: "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31",
          url: "https://www.microsoft.com/microsoft-365",
          description: "Aplicaciones de Office en la nube: Word, Excel, PowerPoint, Teams"
        },
        {
          id: "app3",
          name: "Slack",
          icon: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_128.png",
          url: "https://slack.com/",
          description: "Plataforma de comunicación para equipos de trabajo"
        }
      ]
    },
    {
      id: "cat2",
      name: "Diseño",
      apps: [
        {
          id: "app4",
          name: "Figma",
          icon: "https://cdn.sanity.io/images/599r6htc/localized/46a76c802176eb17b04e12108de7e7e0f3736dc6-1024x1024.png?w=804&h=804&q=75&fit=max&auto=format",
          url: "https://figma.com/",
          description: "Herramienta de diseño colaborativo en la nube"
        },
        {
          id: "app5",
          name: "Canva",
          icon: "https://static.canva.com/static/images/canva-logo-blue.svg",
          url: "https://canva.com/",
          description: "Plataforma de diseño gráfico y composición de imágenes"
        }
      ]
    },
    {
      id: "cat3",
      name: "Desarrollo",
      apps: [
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
        },
        {
          id: "app8",
          name: "CodeSandbox",
          icon: "https://codesandbox.io/favicon.ico",
          url: "https://codesandbox.io/",
          description: "Entorno de desarrollo instantáneo para aplicaciones web"
        }
      ]
    }
  ];

  // Durante el desarrollo, usamos el usuario simulado si no hay usuario autenticado
  const effectiveUser = user || mockUser;

  useEffect(() => {
    setIsLoading(true);
    
    // Extraer todas las aplicaciones de las categorías
    const apps: AppData[] = [];
    mockCategories.forEach(category => {
      category.apps.forEach(app => {
        apps.push(app);
      });
    });
    
    setAllApps(apps);
    
    // Iniciar con todos los resultados si no hay búsqueda
    if (!searchTerm) {
      setSearchResults(apps);
    } else {
      filterApps(searchTerm, apps);
    }
    
    // Simular carga
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  // Función para filtrar aplicaciones
  const filterApps = (term: string, apps: AppData[] = allApps) => {
    const filtered = apps.filter(app => 
      app.name.toLowerCase().includes(term.toLowerCase()) || 
      (app.description && app.description.toLowerCase().includes(term.toLowerCase()))
    );
    setSearchResults(filtered);
  };

  // Manejador para cambios en el input de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterApps(term);
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
            <h1 className="text-2xl font-bold text-neutral-800">Búsqueda</h1>
          </div>
        </header>
        
        {/* Search Content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar aplicaciones por nombre o descripción..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 py-6 text-lg"
                autoFocus
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {[...Array(8)].map((_, i) => (
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
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                  {searchResults.map(app => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 mb-4 text-neutral-300">
                    <SearchIcon className="w-full h-full" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-700">No se encontraron resultados</h3>
                  <p className="text-neutral-500 mt-2">Intenta buscar con otros términos</p>
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