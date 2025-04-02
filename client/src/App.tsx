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

// Router component
function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Auth} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
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
