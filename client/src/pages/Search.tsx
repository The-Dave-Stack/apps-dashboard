import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import AppCard from "@/components/AppCard";
import { fetchCategories } from "@/lib/firebase";
import { AppData } from "@/lib/types";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AppData[]>([]);
  const [allApps, setAllApps] = useState<AppData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const search = useSearch();

  useEffect(() => {
    // Extraer el parámetro de búsqueda de la URL si existe
    const urlParams = new URLSearchParams(search);
    const queryParam = urlParams.get('q');
    if (queryParam) {
      setSearchTerm(queryParam);
    }
    
    // Cargar los datos de las categorías
    const loadApps = async () => {
      setIsLoading(true);
      try {
        // Cargar categorías desde Firebase
        const categories = await fetchCategories();
        
        // Extraer todas las aplicaciones de las categorías
        const apps: AppData[] = [];
        categories.forEach(category => {
          category.apps.forEach(app => {
            apps.push(app);
          });
        });
        
        setAllApps(apps);
        
        // Filtrar por el término de búsqueda (si existe)
        if (queryParam) {
          filterApps(queryParam, apps);
        } else {
          setSearchResults(apps);
        }
      } catch (error) {
        console.error("Error al cargar datos para búsqueda:", error);
        setAllApps([]);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadApps();
  }, [search]);

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
    <>
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-600">Búsqueda</h1>
        <p className="text-neutral-500 mt-1">Encuentra rápidamente las aplicaciones que necesitas</p>
      </div>
      
      {/* Search Input */}
      <div className="max-w-2xl mb-8">
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
      
      {/* Search Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchResults.map(app => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-neutral-200">
              <div className="mx-auto w-16 h-16 mb-4 text-neutral-300">
                <SearchIcon className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-neutral-700">No se encontraron resultados</h3>
              <p className="text-neutral-500 mt-2">Intenta buscar con otros términos</p>
            </div>
          )}
        </>
      )}
    </>
  );
}