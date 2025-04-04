import { useState, useEffect } from "react";
import { fetchCategories } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import CategorySection from "@/components/CategorySection";
import { CategoryData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, InfoIcon } from "lucide-react";
import { checkFirebaseConnection } from "@/lib/firebase-check";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const { toast } = useToast();
  const { t } = useTranslation();
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
            title: t("errors.connectionError"),
            description: t("errors.firebaseConnection"),
            variant: "destructive",
          });
        } else if (!status.auth) {
          toast({
            title: t("errors.notAuthenticated"),
            description: t("errors.loginRequired"),
            variant: "destructive",
          });
        } else if (!status.read) {
          toast({
            title: t("errors.permissionError"),
            description: t("errors.readPermissionDenied"),
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
            title: t("common.information"),
            description: t("dashboard.noAppsConfigured"),
          });
        }
        
        // Establecemos las categorías en el estado
        setCategories(categoriesData);
      } catch (error: any) {
        console.error("Error fetching categories:", error);
        
        // Muestra mensaje de error pero no bloquea la aplicación
        if (error?.code === "permission-denied") {
          toast({
            title: t("errors.permissionError"),
            description: t("errors.categoryReadPermission"),
            variant: "destructive",
          });
        } else {
          toast({
            title: t("errors.dataLoadError"),
            description: t("errors.appLoadError"),
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
        <h1 className="text-2xl font-bold text-primary-600">{t("navigation.dashboard")}</h1>
        <p className="text-neutral-500 mt-1">{t("dashboard.subtitle")}</p>
      </div>
      
      {/* Firebase Status Alert */}
      {firebaseStatus && !firebaseStatus.connection && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-800" />
          <AlertDescription className="text-red-800">
            {t("errors.firebaseConnectionRetry")}
          </AlertDescription>
        </Alert>
      )}
      
      {firebaseStatus && firebaseStatus.connection && !firebaseStatus.auth && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-800" />
          <AlertDescription className="text-amber-800">
            {t("errors.notLoggedInLimited")}
          </AlertDescription>
        </Alert>
      )}
      
      {firebaseStatus && firebaseStatus.auth && !firebaseStatus.read && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-800" />
          <AlertDescription className="text-red-800">
            {t("errors.permissionContactAdmin")}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Eliminamos barra de búsqueda duplicada. Ya hay una en el topbar */}
      
      {/* Dashboard Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-neutral-200 dark:border-gray-700 p-6 h-64 animate-pulse">
              <div className="h-8 w-1/2 bg-neutral-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-24 bg-neutral-100 dark:bg-gray-700 rounded"></div>
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
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-neutral-200 dark:border-gray-700">
              {categories.length > 0 ? (
                // Si hay categorías pero el filtro no encontró resultados
                <>
                  <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-200">{t("common.noResults")}</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-2">{t("dashboard.adjustSearchTerms")}</p>
                </>
              ) : (
                // Si no hay categorías en absoluto
                <>
                  <div className="mx-auto w-16 h-16 mb-4 text-neutral-300 dark:text-neutral-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-200">{t("dashboard.noAppsAvailable")}</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-2">{t("dashboard.adminMustConfigure")}</p>
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-4 max-w-md mx-auto">
                    {t("dashboard.contactAdmin")}
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
