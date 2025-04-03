import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/Layout";

// Importamos las páginas
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/not-found";
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";
import Recent from "./pages/Recent";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";

// Componente para la página Dashboard
const DashboardPage = () => (
  <Layout>
    <Dashboard />
  </Layout>
);

// Componente para la página Search
const SearchPage = () => (
  <Layout>
    <Search />
  </Layout>
);

// Componente para la página Favorites
const FavoritesPage = () => (
  <Layout>
    <Favorites />
  </Layout>
);

// Componente para la página Recent
const RecentPage = () => (
  <Layout>
    <Recent />
  </Layout>
);

// Componente para la página Settings
const SettingsPage = () => (
  <Layout showSearch={false}>
    <Settings />
  </Layout>
);

// Componente para la página Admin
const AdminPage = () => (
  <Layout showSearch={false}>
    <AdminPanel />
  </Layout>
);

// Componente para la página NotFound
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
      <Route path="/" component={DashboardPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/favorites" component={FavoritesPage} />
      <Route path="/recent" component={RecentPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

// Main App component
function App() {
  const [location, setLocation] = useLocation();
  
  // Redirección a /auth si no hay usuario (simplificado, se puede mejorar con context)
  useEffect(() => {
    const checkAuth = async () => {
      // Aquí podríamos comprobar si hay un usuario autenticado
      // Por ahora lo dejamos sin implementar para evitar redirecciones continuas
    };
    
    checkAuth();
  }, []);

  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}

export default App;
