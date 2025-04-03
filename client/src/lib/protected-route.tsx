import { useAuth } from "@/lib/hooks";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  // Si aún estamos cargando, mostramos un indicador de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigimos a la página de autenticación
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Si hay usuario autenticado, renderizamos los children
  return <>{children}</>;
}