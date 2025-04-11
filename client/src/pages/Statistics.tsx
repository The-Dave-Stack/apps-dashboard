import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  BarChart as BarChartIcon, 
  Clock, 
  Calendar
} from "lucide-react";
import {
  BarChart as BarChartComponent,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { collection, doc, getDoc, getDocs, query, where, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useAuth } from "@/lib/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AppCard from "@/components/AppCard";
import { getFirebaseInstances } from "@/lib/firebase-init";

// Interfaces para los datos
interface UsageStats {
  totalAccesses: number;
  mostActiveHour: number;
  mostActiveDay: string;
  hourlyActivity: { hour: number; count: number }[];
  dailyActivity: { day: string; count: number }[];
  topApps: { id: string; name: string; icon: string; url: string; count: number }[];
}

interface AccessData {
  appId: string;
  appName: string;
  appIcon: string;
  appUrl: string;
  hour: number;
  day: number;
  timestamp: Date;
}

export default function Statistics() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'allTime'>('week');
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Función auxiliar para obtener el nombre del día
  const getDayName = (dayIndex: number): string => {
    const days = [
      t("statistics.days.sunday"),
      t("statistics.days.monday"),
      t("statistics.days.tuesday"),
      t("statistics.days.wednesday"),
      t("statistics.days.thursday"),
      t("statistics.days.friday"),
      t("statistics.days.saturday")
    ];
    return days[dayIndex];
  };

  // Obtener estadísticas de uso
  useEffect(() => {
    if (!user) return;

    const fetchStatistics = async () => {
      setLoading(true);
      setError(null);

      try {
        // Obtener Firestore
        const { db } = getFirebaseInstances();
        
        // Calcular la fecha límite según el período seleccionado
        const now = new Date();
        let limitDate = new Date();
        if (period === 'week') {
          limitDate.setDate(now.getDate() - 7);
        } else if (period === 'month') {
          limitDate.setDate(now.getDate() - 30);
        } else {
          // For 'allTime', set a very old date
          limitDate = new Date(2020, 0, 1);
        }

        // Obtener historial de accesos
        const accessesRef = collection(db, 'users', user.uid, 'accessHistory');
        
        let accessQuery;
        if (period !== 'allTime') {
          accessQuery = query(accessesRef, where('timestamp', '>=', limitDate));
        } else {
          accessQuery = query(accessesRef);
        }
        
        const accessesSnapshot = await getDocs(accessQuery);
        
        // Si no hay datos, establecer valores predeterminados
        if (accessesSnapshot.empty) {
          setStats({
            totalAccesses: 0,
            mostActiveHour: 0,
            mostActiveDay: getDayName(new Date().getDay()),
            hourlyActivity: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
            dailyActivity: Array.from({ length: 7 }, (_, i) => ({ day: getDayName(i), count: 0 })),
            topApps: []
          });
          setLoading(false);
          return;
        }

        // Procesar los datos para las estadísticas
        const accesses: AccessData[] = accessesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          const timestamp = data.timestamp?.toDate() || new Date();
          return {
            appId: data.appId,
            appName: data.appName || "Unknown",
            appIcon: data.appIcon || "",
            appUrl: data.appUrl || "#",
            hour: timestamp.getHours(),
            day: timestamp.getDay(),
            timestamp
          };
        });

        // Calcular estadísticas
        const totalAccesses = accesses.length;
        
        // Contar por hora
        const hourCounts = Array(24).fill(0);
        accesses.forEach((access: AccessData) => hourCounts[access.hour]++);
        const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));
        
        // Contar por día
        const dayCounts = Array(7).fill(0);
        accesses.forEach((access: AccessData) => dayCounts[access.day]++);
        const mostActiveDay = getDayName(dayCounts.indexOf(Math.max(...dayCounts)));
        
        // Estadística de actividad por hora
        const hourlyActivity = hourCounts.map((count, hour) => ({
          hour,
          count
        }));
        
        // Estadística de actividad por día
        const dailyActivity = dayCounts.map((count, dayIndex) => ({
          day: getDayName(dayIndex),
          count
        }));
        
        // Top apps por uso
        const appCounts: Record<string, { count: number; name: string; icon: string; url: string }> = {};
        accesses.forEach((access: AccessData) => {
          if (!appCounts[access.appId]) {
            appCounts[access.appId] = { 
              count: 0, 
              name: access.appName, 
              icon: access.appIcon,
              url: access.appUrl
            };
          }
          appCounts[access.appId].count++;
        });
        
        const topApps = Object.entries(appCounts)
          .map(([id, { count, name, icon, url }]) => ({ id, name, icon, url, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        setStats({
          totalAccesses,
          mostActiveHour,
          mostActiveDay,
          hourlyActivity,
          dailyActivity,
          topApps
        });
      } catch (err) {
        console.error("Error fetching statistics:", err);
        setError(t("errors.dataLoadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [user, period, t]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("statistics.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("statistics.subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="week" value={period} onValueChange={(value) => setPeriod(value as any)}>
        <TabsList>
          <TabsTrigger value="week">{t("statistics.periods.week")}</TabsTrigger>
          <TabsTrigger value="month">{t("statistics.periods.month")}</TabsTrigger>
          <TabsTrigger value="allTime">{t("statistics.periods.allTime")}</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-6 mt-6">
          {loading ? (
            // Esqueleto para carga
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-8 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            // Mensaje de error
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          ) : stats && stats.totalAccesses > 0 ? (
            // Contenido principal
            <>
              {/* Indicadores principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium flex items-center">
                      <BarChartIcon className="mr-2 h-5 w-5 text-primary" />
                      {t("statistics.totalAccesses")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats.totalAccesses}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-primary" />
                      {t("statistics.mostActiveHour")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats.mostActiveHour}:00</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-primary" />
                      {t("statistics.mostActiveDay")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats.mostActiveDay}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfica de actividad por hora */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("statistics.hourlyActivity")}</CardTitle>
                  <CardDescription>{t("statistics.hourlyActivityDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChartComponent
                      data={stats.hourlyActivity}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} ${t("statistics.accesses")}`, '']} />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChartComponent>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfica de actividad por día */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("statistics.dailyActivity")}</CardTitle>
                  <CardDescription>{t("statistics.dailyActivityDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={stats.dailyActivity}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} ${t("statistics.accesses")}`, '']} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Apps */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("statistics.topApps")}</CardTitle>
                  <CardDescription>{t("statistics.topAppsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {stats.topApps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={{
                        id: app.id,
                        name: app.name,
                        icon: app.icon,
                        url: app.url,
                        description: ""
                      }}
                      badge={<Badge variant="secondary">{app.count} {t("statistics.accesses")}</Badge>}
                      compact
                    />
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            // Sin datos
            <Card>
              <CardContent className="pt-6 text-center">
                <h3 className="text-xl font-semibold mb-2">{t("statistics.noData")}</h3>
                <p className="text-muted-foreground">{t("statistics.useMoreApps")}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}