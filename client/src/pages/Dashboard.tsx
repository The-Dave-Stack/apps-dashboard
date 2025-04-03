import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, logout } from "@/lib/hooks";
import { fetchCategories } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import CategorySection from "@/components/CategorySection";
import { CategoryData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LogOut } from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Redirigir a la página de autenticación si no hay usuario
    if (!user) {
      console.log("Usuario no autenticado, redirigiendo a /auth");
      setLocation("/auth");
      return;
    }

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
        setLoading(false);
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
        setLoading(false);
      }
    };

    fetchCategoriesData();
  }, [user, toast, setLocation]);

  // Filter apps based on search term
  const filteredCategories = categories.map(category => ({
    ...category,
    apps: category.apps.filter(app => 
      app.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.apps.length > 0);

  // En este punto siempre tenemos un usuario autenticado debido al redirect
  const userEmail = user?.email || "";
  const userPhotoURL = user?.photoURL;
  
  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      setLocation("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión. Intenta de nuevo.",
        variant: "destructive",
      });
    }
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
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                type="text" 
                className="w-32 pl-8 h-9" 
                placeholder="Buscar..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="h-4 w-4 text-neutral-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="text-neutral-500 h-9 w-9"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            
            <div className="h-8 w-8 rounded-full bg-neutral-300 overflow-hidden">
              {userPhotoURL ? (
                <img src={userPhotoURL} alt="User avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary-100 text-primary-600">
                  {userEmail ? userEmail[0].toUpperCase() : "U"}
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Desktop Header */}
        <header className="hidden md:block bg-white border-b border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="relative max-w-sm">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <Input
                  type="text" 
                  className="pl-10" 
                  placeholder="Buscar aplicaciones..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-neutral-200 overflow-hidden">
                    {userPhotoURL ? (
                      <img src={userPhotoURL} alt="User avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary-100 text-primary-600">
                        {userEmail ? userEmail[0].toUpperCase() : "U"}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-neutral-700">{userEmail}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-neutral-600 hover:text-red-600 hover:border-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="flex-1 p-4 md:p-6">
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
                <div className="text-center py-12">
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
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
