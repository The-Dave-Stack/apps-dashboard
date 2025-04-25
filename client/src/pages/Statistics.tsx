/**
 * @fileoverview Statistics page component
 * This component displays usage statistics for the user's app interactions,
 * including hourly and daily activity charts, top used apps, and key metrics.
 * @module pages/Statistics
 */

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

/**
 * Interface for usage statistics data
 * @interface UsageStats
 */
interface UsageStats {
  /** Total number of app accesses */
  totalAccesses: number;
  /** Hour of the day with most activity (0-23) */
  mostActiveHour: number;
  /** Most active day name */
  mostActiveDay: string;
  /** Hourly activity distribution */
  hourlyActivity: { hour: number; count: number }[];
  /** Daily activity distribution */
  dailyActivity: { day: string; count: number }[];
  /** Top apps by usage */
  topApps: { id: string; name: string; icon: string; url: string; count: number }[];
}

/**
 * Interface for access history data from Firestore
 * @interface AccessData
 */
interface AccessData {
  /** Unique app identifier */
  appId: string;
  /** App name */
  appName: string;
  /** App icon URL */
  appIcon: string;
  /** App URL */
  appUrl: string;
  /** Hour of access (0-23) */
  hour: number;
  /** Day of access (0-6, Sunday-Saturday) */
  day: number;
  /** Full timestamp of access */
  timestamp: Date;
}

/**
 * Statistics component for displaying app usage metrics and visualizations
 * 
 * This component fetches and displays a user's app usage statistics,
 * showing metrics about app interactions by time (hour, day) and most used apps.
 * It allows filtering by different time periods (week, month, all time).
 * 
 * @returns {JSX.Element} The rendered Statistics component
 */
export default function Statistics() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'allTime'>('week');
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper function to get the localized day name from day index
   * @param {number} dayIndex - Day index (0-6, Sunday-Saturday)
   * @returns {string} Localized day name
   */
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

  // Fetch usage statistics
  useEffect(() => {
    if (!user) return;

    /**
     * Fetches and processes statistics data from Firestore
     */
    const fetchStatistics = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get Firestore instance
        const { db } = getFirebaseInstances();
        
        // Calculate limit date based on selected period
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

        // Get access history collection
        const accessesRef = collection(db, 'users', user.uid, 'accessHistory');
        
        let accessQuery;
        if (period !== 'allTime') {
          accessQuery = query(accessesRef, where('timestamp', '>=', limitDate));
        } else {
          accessQuery = query(accessesRef);
        }
        
        const accessesSnapshot = await getDocs(accessQuery);
        
        // If no data, set default values
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

        // Process data for statistics
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

        // Calculate statistics
        const totalAccesses = accesses.length;
        
        // Count by hour
        const hourCounts = Array(24).fill(0);
        accesses.forEach((access: AccessData) => hourCounts[access.hour]++);
        const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));
        
        // Count by day
        const dayCounts = Array(7).fill(0);
        accesses.forEach((access: AccessData) => dayCounts[access.day]++);
        const mostActiveDay = getDayName(dayCounts.indexOf(Math.max(...dayCounts)));
        
        // Hourly activity statistics
        const hourlyActivity = hourCounts.map((count, hour) => ({
          hour,
          count
        }));
        
        // Daily activity statistics
        const dailyActivity = dayCounts.map((count, dayIndex) => ({
          day: getDayName(dayIndex),
          count
        }));
        
        // Top apps by usage
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
            // Loading skeleton
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
            // Error message
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          ) : stats && stats.totalAccesses > 0 ? (
            // Main content
            <>
              {/* Main indicators */}
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

              {/* Hourly activity chart */}
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

              {/* Daily activity chart */}
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
            // No data
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