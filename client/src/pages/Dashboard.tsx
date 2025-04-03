import { useState, useEffect } from "react";
import { fetchCategories } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import CategorySection from "@/components/CategorySection";
import { CategoryData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCategoriesData = async () => {
      try {
        setLoading(true);
        
        // Cargar los datos desde Firebase usando nuestra función
        const categoriesData = await fetchCategories();
        
        // Si no hay categorías, mostramos un mensaje
        if (categoriesData.length === 0) {
          console.log("No se encontraron categorías en Firebase");
          
          // Mostramos un mensaje indicativo al usuario
          toast({
            title: "Información",
            description: "No hay aplicaciones configuradas todavía. Un administrador debe agregarlas.",
          });
        }
        
        // Establecemos las categorías en el estado
        setCategories(categoriesData);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        
        // Muestra mensaje de error pero no bloquea la aplicación
        toast({
          title: "Error al cargar datos",
          description: "No se pudieron cargar las aplicaciones. Por favor, intente más tarde.",
          variant: "destructive",
        });
        
        // Establecemos un array vacío para que la UI pueda renderizarse sin errores
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesData();
  }, [toast]);

  // Filter apps based on search term
  const filteredCategories = categories.map(category => ({
    ...category,
    apps: category.apps.filter(app => 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.description && app.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(category => category.apps.length > 0);

  return (
    <>
      {/* Dashboard Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-600">Dashboard</h1>
        <p className="text-neutral-500 mt-1">Explora y gestiona todas tus aplicaciones</p>
      </div>
      
      {/* Desktop Search (El móvil está en Topbar) */}
      <div className="hidden md:block mb-6">
        <div className="relative max-w-md">
          <Input
            type="text" 
            className="w-full pl-10 h-10" 
            placeholder="Buscar aplicaciones..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="h-5 w-5 text-neutral-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>
      
      {/* Dashboard Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 h-64 animate-pulse">
              <div className="h-8 w-1/2 bg-neutral-200 rounded mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-24 bg-neutral-100 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-neutral-200">
              {categories.length > 0 ? (
                // Si hay categorías pero el filtro no encontró resultados
                <>
                  <h3 className="text-lg font-medium text-neutral-700">No se encontraron resultados</h3>
                  <p className="text-neutral-500 mt-2">Intenta ajustar los términos de búsqueda</p>
                </>
              ) : (
                // Si no hay categorías en absoluto
                <>
                  <div className="mx-auto w-16 h-16 mb-4 text-neutral-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-neutral-700">No hay aplicaciones disponibles</h3>
                  <p className="text-neutral-500 mt-2">Un administrador debe configurar las aplicaciones primero</p>
                  <p className="text-neutral-400 text-sm mt-4 max-w-md mx-auto">
                    Puedes contactar con el administrador para solicitar que se agreguen tus aplicaciones favoritas.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
