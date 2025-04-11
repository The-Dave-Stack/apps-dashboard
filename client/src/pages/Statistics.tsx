import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseInstances } from "@/lib/firebase-instances";
import { collection, doc, query, getDocs, orderBy, limit, Timestamp, where } from "firebase/firestore";
import { AppData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTranslation } from "react-i18next";
import { AlertTriangle, TrendingUp, Clock, Calendar, Award, BarChartIcon, PieChartIcon } from "lucide-react";
import AppCard from "@/components/AppCard";

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

// Interfaz para los datos de acceso
interface AccessData {
  appId: string;
  appName: string;
  timestamp: Timestamp;
  accessDate: string;
  hourOfDay: number;
  dayOfWeek: number;
}

// Interfaz para datos de app con número de accesos
interface AppAccessCount {
  id: string;
  name: string;
  icon: string;
  url: string;
  count: number;
}

export default function Statistics() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { db } = getFirebaseInstances();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [accessData, setAccessData] = useState<AccessData[]>([]);
  const [topApps, setTopApps] = useState<AppAccessCount[]>([]);
  const [hourlyData, setHourlyData] = useState<{hour: number, count: number}[]>([]);
  const [weekdayData, setWeekdayData] = useState<{day: string, count: number}[]>([]);
  const [totalAccesses, setTotalAccesses] = useState(0);
  const [timeframe, setTimeframe] = useState("7days"); // 7days, 30days, alltime
  
  useEffect(() => {
    loadStatistics();
  }, [user, timeframe]);
  
  const loadStatistics = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Referencia a la colección de historial
      const userHistoryRef = collection(doc(db, "users", user.uid), "history");
      
      // Filtrar por período si es necesario
      let historyQuery;
      if (timeframe !== "alltime") {
        const daysAgo = timeframe === "7days" ? 7 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        
        historyQuery = query(
          userHistoryRef, 
          where("timestamp", ">=", startDate),
          orderBy("timestamp", "desc")
        );
      } else {
        historyQuery = query(userHistoryRef, orderBy("timestamp", "desc"));
      }
      
      const historySnapshot = await getDocs(historyQuery);
      
      if (historySnapshot.empty) {
        setAccessData([]);
        setTopApps([]);
        setHourlyData([]);
        setWeekdayData([]);
        setTotalAccesses(0);
        setIsLoading(false);
        return;
      }
      
      // Procesar los datos de acceso
      const accesses: AccessData[] = [];
      const appAccessCount: Record<string, AppAccessCount> = {};
      const hourCount: Record<number, number> = {};
      const dayCount: Record<number, number> = {};
      
      // Inicializar contadores para cada hora y día
      for (let i = 0; i < 24; i++) {
        hourCount[i] = 0;
      }
      
      for (let i = 0; i < 7; i++) {
        dayCount[i] = 0;
      }
      
      historySnapshot.forEach(doc => {
        const data = doc.data();
        const timestamp = data.timestamp as Timestamp;
        const date = timestamp.toDate();
        
        // Extraer hora y día de la semana
        const hour = date.getHours();
        const day = date.getDay(); // 0 = Domingo, 6 = Sábado
        
        // Incrementar contadores
        hourCount[hour]++;
        dayCount[day]++;
        
        // Preparar datos de acceso
        const access: AccessData = {
          appId: data.appId,
          appName: data.name,
          timestamp,
          accessDate: date.toLocaleDateString(),
          hourOfDay: hour,
          dayOfWeek: day
        };
        
        accesses.push(access);
        
        // Contar accesos por aplicación
        if (!appAccessCount[data.appId]) {
          appAccessCount[data.appId] = {
            id: data.appId,
            name: data.name,
            icon: data.icon,
            url: data.url,
            count: 0
          };
        }
        
        appAccessCount[data.appId].count++;
      });
      
      // Convertir datos para gráficos
      const hourlyDataArray = Object.entries(hourCount).map(([hour, count]) => ({
        hour: parseInt(hour),
        count
      }));
      
      const weekdays = [
        t('statistics.days.sunday'),
        t('statistics.days.monday'),
        t('statistics.days.tuesday'),
        t('statistics.days.wednesday'),
        t('statistics.days.thursday'),
        t('statistics.days.friday'),
        t('statistics.days.saturday')
      ];
      
      const weekdayDataArray = Object.entries(dayCount).map(([day, count]) => ({
        day: weekdays[parseInt(day)],
        count
      }));
      
      // Ordenar aplicaciones por número de accesos
      const topAppsArray = Object.values(appAccessCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setAccessData(accesses);
      setTopApps(topAppsArray);
      setHourlyData(hourlyDataArray);
      setWeekdayData(weekdayDataArray);
      setTotalAccesses(accesses.length);
      
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      toast({
        title: t('errors.title'),
        description: t('errors.loadingData'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatHour = (hour: number) => {
    return `${hour}:00`;
  };
  
  return (
    <>
      {/* Título de la página */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-600">{t('statistics.title')}</h1>
        <p className="text-neutral-500 mt-1">{t('statistics.subtitle')}</p>
      </div>
      
      {/* Selector de período */}
      <div className="mb-6">
        <Tabs value={timeframe} onValueChange={setTimeframe} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="7days">{t('statistics.periods.week')}</TabsTrigger>
            <TabsTrigger value="30days">{t('statistics.periods.month')}</TabsTrigger>
            <TabsTrigger value="alltime">{t('statistics.periods.allTime')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Contenido de estadísticas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 h-64">
              <div className="h-6 bg-neutral-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-neutral-200 rounded w-3/4 mb-8"></div>
              <div className="h-32 bg-neutral-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {totalAccesses > 0 ? (
            <div className="space-y-6">
              {/* Tarjetas de resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-primary-500" />
                      {t('statistics.totalAccesses')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{totalAccesses}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-primary-500" />
                      {t('statistics.mostActiveHour')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {hourlyData.reduce((prev, current) => (prev.count > current.count) ? prev : current).hour}:00
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-primary-500" />
                      {t('statistics.mostActiveDay')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {weekdayData.reduce((prev, current) => (prev.count > current.count) ? prev : current).day}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChartIcon className="h-5 w-5 mr-2 text-primary-500" />
                      {t('statistics.hourlyActivity')}
                    </CardTitle>
                    <CardDescription>
                      {t('statistics.hourlyActivityDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="hour" 
                          tickFormatter={formatHour}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value) => [value, t('statistics.accesses')]}
                          labelFormatter={(label) => `${label}:00 - ${(label + 1) % 24}:00`}
                        />
                        <Bar dataKey="count" fill="#8884d8" name={t('statistics.accesses')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChartIcon className="h-5 w-5 mr-2 text-primary-500" />
                      {t('statistics.dailyActivity')}
                    </CardTitle>
                    <CardDescription>
                      {t('statistics.dailyActivityDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekdayData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value) => [value, t('statistics.accesses')]}
                        />
                        <Bar dataKey="count" fill="#82ca9d" name={t('statistics.accesses')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              
              {/* Top aplicaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary-500" />
                    {t('statistics.topApps')}
                  </CardTitle>
                  <CardDescription>
                    {t('statistics.topAppsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {topApps.map((app, index) => (
                      <AppCard 
                        key={app.id} 
                        app={app} 
                        badge={`${index + 1}. ${app.count} ${t('statistics.accesses')}`} 
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-neutral-200">
              <div className="mx-auto w-16 h-16 mb-4 text-neutral-300">
                <BarChartIcon className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-neutral-700">{t('statistics.noData')}</h3>
              <p className="text-neutral-500 mt-2">{t('statistics.useMoreApps')}</p>
            </div>
          )}
        </>
      )}
    </>
  );
}