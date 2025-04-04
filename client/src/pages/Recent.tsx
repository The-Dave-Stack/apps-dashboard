import { useState, useEffect } from "react";
import { History } from "lucide-react";
import AppCard from "@/components/AppCard";
import { useAuth } from "@/lib/hooks";
import { AppData } from "@/lib/types";
import { getFirebaseInstances } from "@/lib/firebase-init";
import { collection, getDocs, query, orderBy, limit, doc, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { fetchCategories } from "@/lib/firebase";
import { useTranslation } from "react-i18next";

// Tipo extendido para incluir información de acceso
interface RecentApp extends AppData {
  lastAccessed: Timestamp;
}

export default function Recent() {
  const [recentApps, setRecentApps] = useState<AppData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { db } = getFirebaseInstances();
  const { t } = useTranslation();

  useEffect(() => {
    const loadRecentApps = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Intentar cargar el historial de apps recientes del usuario
        const userHistoryRef = collection(doc(db, "users", user.uid), "history");
        const historyQuery = query(userHistoryRef, orderBy("lastAccessed", "desc"), limit(10));
        const historySnapshot = await getDocs(historyQuery);

        if (historySnapshot.empty) {
          setRecentApps([]);
          setIsLoading(false);
          return;
        }

        // Obtener todas las categorías para buscar apps recientes
        const categories = await fetchCategories();
        const allApps: AppData[] = [];
        
        // Reunir todas las apps de todas las categorías
        categories.forEach(category => {
          category.apps.forEach(app => {
            allApps.push(app);
          });
        });

        // Mapear el historial a las apps correspondientes
        const historyEntries = historySnapshot.docs.map(doc => ({
          id: doc.id,
          lastAccessed: doc.data().lastAccessed
        }));

        // Encontrar las apps correspondientes y ordenarlas por último acceso
        const userRecentApps = historyEntries
          .map(entry => {
            const app = allApps.find(app => app.id === entry.id);
            return app ? app : null;
          })
          .filter((app): app is AppData => app !== null);
        
        setRecentApps(userRecentApps);
      } catch (error) {
        console.error("Error al cargar historial reciente:", error);
        toast({
          title: t('common.error'),
          description: t('recent.errorLoading'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentApps();
  }, [user, db, toast]);
  
  // Función de utilidad para formatear tiempo relativo que podríamos usar en el futuro
  const getTimeAgo = (timestamp: Timestamp): string => {
    const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
    
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
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-600">{t('recent.title')}</h1>
        <p className="text-neutral-500 mt-1">{t('recent.subtitle')}</p>
      </div>
      
      {/* Recent Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
            <>
              <h2 className="text-lg font-medium text-neutral-800 mb-4">{t('recent.lastDay')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {recentApps.map(app => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-neutral-200">
              <div className="mx-auto w-16 h-16 mb-4 text-neutral-300">
                <History className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-neutral-700">{t('recent.noActivity')}</h3>
              <p className="text-neutral-500 mt-2">{t('recent.appsWillAppear')}</p>
            </div>
          )}
        </>
      )}
    </>
  );
}