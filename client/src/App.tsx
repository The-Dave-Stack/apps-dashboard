import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useAuth, logout } from "@/lib/hooks";
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
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return <Component />;
}

// Ruta que redirige si ya está autenticado
function AuthRoute() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (user) {
    return <Redirect to="/" />;
  }
  
  return <Auth />;
}

// Router component - Simplificado para evitar redirecciones innecesarias
function AppRouter() {
  return (
    <Switch>
      <Route path="/auth" component={AuthRoute} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/search" component={() => <ProtectedRoute component={Search} />} />
      <Route path="/favorites" component={() => <ProtectedRoute component={Favorites} />} />
      <Route path="/recent" component={() => <ProtectedRoute component={Recent} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPanel} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Component for handling logout
function LogoutButton() {
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
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
