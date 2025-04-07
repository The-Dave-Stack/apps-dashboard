import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import Topbar from "@/components/Topbar";

interface LayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
}

export default function Layout({ children, showSearch = true }: LayoutProps) {
  const [location] = useLocation();

  // No renderizar el layout en la página de autenticación
  if (location === "/auth") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar para pantallas medianas y grandes, oculto en móviles */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barra superior - Ya no necesitamos toggleMobileMenu en móviles */}
        <Topbar showSearch={showSearch} />
        
        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
        
        {/* Navegación móvil - Solo visible en móviles */}
        <MobileNav />
      </div>
    </div>
  );
}