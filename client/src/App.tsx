import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/lib/protected-route";
import { useEffect } from "react";
import { initTheme } from "@/lib/theme-service";
import { LanguageProvider } from "@/i18n/LanguageContext";
import "@/i18n/index";

// Importamos las páginas
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/not-found";
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";
import Recent from "./pages/Recent";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import CategoryDetail from "./pages/CategoryDetail";

// Componentes para las páginas
const DashboardPage = () => (
  <Layout>
    <Dashboard />
  </Layout>
);

const SearchPage = () => (
  <Layout>
    <Search />
  </Layout>
);

const FavoritesPage = () => (
  <Layout>
    <Favorites />
  </Layout>
);

const RecentPage = () => (
  <Layout>
    <Recent />
  </Layout>
);

const SettingsPage = () => (
  <Layout showSearch={false}>
    <Settings />
  </Layout>
);

const AdminPage = () => (
  <Layout showSearch={false}>
    <AdminPanel />
  </Layout>
);

const CategoryDetailPage = () => (
  <Layout>
    <CategoryDetail />
  </Layout>
);

const NotFoundPage = () => (
  <Layout showSearch={false}>
    <NotFound />
  </Layout>
);

// Rutas de la aplicación
function AppRouter() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/search">
        <ProtectedRoute>
          <SearchPage />
        </ProtectedRoute>
      </Route>
      <Route path="/favorites">
        <ProtectedRoute>
          <FavoritesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/recent">
        <ProtectedRoute>
          <RecentPage />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AdminPage />
        </ProtectedRoute>
      </Route>
      <Route path="/category/:id">
        <ProtectedRoute>
          <CategoryDetailPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFoundPage} />
    </Switch>
  );
}

// Main App component
function App() {
  // Inicializar el tema cuando carga la aplicación
  useEffect(() => {
    initTheme();
    console.log("Theme initialized");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AppRouter />
        <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
