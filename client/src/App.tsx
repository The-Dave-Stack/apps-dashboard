import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { logout, useAuthState } from "./lib/hooks";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/not-found";
import { Button } from "@/components/ui/button";

// Protected Route component that checks authentication
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuthState();
  const [, setLocation] = useLocation();

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="h-10 w-10 rounded-full border-4 border-primary-600 border-t-transparent animate-spin">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/');
    return null;
  }

  // Render the protected component if authenticated
  return <Component />;
}

// Component for handling logout
function LogoutButton() {
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
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

// Importamos las nuevas páginas
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";
import Recent from "./pages/Recent";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";

// Router component
function AppRouter() {
  // Temporalmente, mostramos directamente el dashboard sin protección
  return (
    <Switch>
      {/* Ruta principal al Dashboard */}
      <Route path="/" component={Dashboard} />
      
      {/* Rutas para las funcionalidades principales */}
      <Route path="/search" component={Search} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/recent" component={Recent} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin" component={AdminPanel} />
      
      {/* Ruta de autenticación (temporalmente no utilizada) */}
      <Route path="/auth" component={Auth} />
      
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
