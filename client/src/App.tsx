import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useAuth, logout } from "@/lib/hooks";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Importamos las páginas
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/not-found";
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";
import Recent from "./pages/Recent";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";

// Protected Route component that checks authentication
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Si no estamos cargando y no hay usuario, redirigir a la página de autenticación
    if (!loading && !user) {
      console.log("Usuario no autenticado, redirigiendo a /auth");
      setLocation("/auth");
    }
  }, [user, loading, setLocation]);

  // Mientras se verifica la autenticación, mostramos un indicador de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
        <div className="h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si el usuario está autenticado, mostramos el componente
  return user ? <Component /> : null;
}

// Component for handling logout
function LogoutButton() {
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/auth');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Button onClick={handleLogout} variant="outline" className="text-red-500 hover:bg-red-50">
      Cerrar Sesión
    </Button>
  );
}

// Router component
function AppRouter() {
  return (
    <Switch>
      {/* Rutas públicas */}
      <Route path="/auth" component={Auth} />
      
      {/* Rutas protegidas */}
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/search" component={() => <ProtectedRoute component={Search} />} />
      <Route path="/favorites" component={() => <ProtectedRoute component={Favorites} />} />
      <Route path="/recent" component={() => <ProtectedRoute component={Recent} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPanel} />} />
      
      {/* Ruta para páginas no encontradas */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Main App component
function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}

export default App;
