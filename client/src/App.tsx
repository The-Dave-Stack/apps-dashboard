import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useAuth, logout } from "@/lib/hooks";
import { useEffect, useState } from "react";
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

// Spinner de carga para toda la aplicación
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <div className="h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// Protected Route component that checks authentication
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  // Solo realizamos la redirección una vez cuando sabemos con certeza que no hay usuario autenticado
  useEffect(() => {
    if (!loading && !user && location !== "/auth") {
      setLocation("/auth");
    }
  }, [user, loading, setLocation, location]);

  // Mientras se verifica la autenticación, mostramos el spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  // Si el usuario no está autenticado, no mostramos nada (la redirección ya se hizo)
  if (!user) {
    return null;
  }

  // Si llegamos aquí, el usuario está autenticado y podemos mostrar el componente
  return <Component />;
}

// Router component - Simplificado para evitar redirecciones innecesarias
function AppRouter() {
  const { user, loading } = useAuth();

  // Mientras se verifica la autenticación inicial, mostramos el spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Switch>
      {/* Si no hay usuario, solo permitimos acceso a Auth */}
      {!user ? (
        <>
          <Route path="/auth" component={Auth} />
          <Route component={() => {
            const [, setLocation] = useLocation();
            useEffect(() => {
              setLocation("/auth");
            }, [setLocation]);
            return null;
          }} />
        </>
      ) : (
        /* Si hay usuario, permitimos acceso a todas las rutas excepto Auth */
        <>
          <Route path="/auth" component={() => {
            const [, setLocation] = useLocation();
            useEffect(() => {
              setLocation("/");
            }, [setLocation]);
            return null;
          }} />
          
          <Route path="/" component={Dashboard} />
          <Route path="/search" component={Search} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/recent" component={Recent} />
          <Route path="/settings" component={Settings} />
          <Route path="/admin" component={AdminPanel} />
          
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
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
