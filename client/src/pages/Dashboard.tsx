import { useState, useEffect } from "react";
import { fetchCategories } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import CategorySection from "@/components/CategorySection";
import { CategoryData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, InfoIcon } from "lucide-react";
import { checkFirebaseConnection } from "@/lib/firebase-check";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [firebaseStatus, setFirebaseStatus] = useState<{
    connection: boolean;
    read: boolean;
    write: boolean;
    auth: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const checkFirebase = async () => {
      try {
        const status = await checkFirebaseConnection();
        setFirebaseStatus(status);
        
        if (!status.connection) {
          toast({
            title: "Error de conexión",
            description: "No se pudo conectar con Firebase. Verifica tu conexión a internet.",
            variant: "destructive",
          });
        } else if (!status.auth) {
          toast({
            title: "No autenticado",
            description: "Es necesario iniciar sesión para acceder a todas las funcionalidades.",
            variant: "destructive",
          });
        } else if (!status.read) {
          toast({
            title: "Error de permisos",
            description: "No tienes permisos para leer datos en Firestore.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking Firebase:", error);
      }
    };
    
    checkFirebase();
  }, [toast]);

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
        console.error("Error fetching categories:", error);
        
        // Muestra mensaje de error pero no bloquea la aplicación
        if (error?.code === "permission-denied") {
          toast({
            title: "Error de permisos",
            description: "No tienes permisos para leer las categorías. Verifica que estés autenticado.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error al cargar datos",
            description: "No se pudieron cargar las aplicaciones. Por favor, intente más tarde.",
            variant: "destructive",
          });
        }
        
        // Establecemos un array vacío para que la UI pueda renderizarse sin errores
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    if (firebaseStatus && firebaseStatus.connection) {
      fetchCategoriesData();
    } else {
      setLoading(false);
    }
  }, [toast, firebaseStatus]);

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
      
      {/* Firebase Status Alert */}
      {firebaseStatus && !firebaseStatus.connection && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-800" />
          <AlertDescription className="text-red-800">
            No hay conexión con Firebase. Verifica tu conexión a internet y vuelve a intentarlo.
          </AlertDescription>
        </Alert>
      )}
      
      {firebaseStatus && firebaseStatus.connection && !firebaseStatus.auth && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-800" />
          <AlertDescription className="text-amber-800">
            No has iniciado sesión. Algunas funciones estarán limitadas hasta que inicies sesión.
          </AlertDescription>
        </Alert>
      )}
      
      {firebaseStatus && firebaseStatus.auth && !firebaseStatus.read && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-800" />
          <AlertDescription className="text-red-800">
            Error de permisos: No tienes acceso para leer datos. Contacta al administrador.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Eliminamos barra de búsqueda duplicada. Ya hay una en el topbar */}
      
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
