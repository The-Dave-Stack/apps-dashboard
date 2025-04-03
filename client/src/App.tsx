import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
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

// Rutas simples sin autenticación para solucionar el problema
function AppRouter() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/" component={Dashboard} />
      <Route path="/search" component={Search} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/recent" component={Recent} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin" component={AdminPanel} />
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
