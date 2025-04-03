import { useState } from "react";
import { Settings as SettingsIcon, User, Bell, Moon, Sun, Globe, Shield, LogOut } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/hooks";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/lib/auth";
import { useLocation } from "wouter";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Estados para las configuraciones
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("es");
  
  // Usuario simulado para el desarrollo (temporal)
  const mockUser = {
    uid: "mock-user-id",
    email: "usuario@ejemplo.com",
    displayName: "Usuario de Prueba",
    photoURL: null
  };

  // Durante el desarrollo, usamos el usuario simulado si no hay usuario autenticado
  const effectiveUser = user || mockUser;
  
  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      setLocation("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };
  
  // Manejadores para cambios en configuraciones
  const handleDarkModeChange = () => {
    setDarkMode(!darkMode);
    toast({
      title: !darkMode ? "Modo oscuro activado" : "Modo claro activado",
      description: "La configuración se ha guardado correctamente"
    });
  };
  
  const handleNotificationsChange = () => {
    setNotifications(!notifications);
    toast({
      title: !notifications ? "Notificaciones activadas" : "Notificaciones desactivadas",
      description: "La configuración se ha guardado correctamente"
    });
  };
  
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    toast({
      title: "Idioma cambiado",
      description: `El idioma se ha cambiado a ${lang === 'es' ? 'Español' : 'English'}`
    });
  };

  return (
    <Layout showSearch={false}>
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-600">Configuración</h1>
        <p className="text-neutral-500 mt-1">Gestiona tus preferencias y datos de usuario</p>
      </div>
      
      {/* Settings Content */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mb-6">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0">
              {effectiveUser?.photoURL ? (
                <img 
                  src={effectiveUser.photoURL} 
                  alt="Foto de perfil" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-100">
                  <span className="text-2xl font-medium text-primary-600">
                    {effectiveUser.email ? effectiveUser.email[0].toUpperCase() : "U"}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-neutral-800">
                {effectiveUser.displayName || "Usuario"}
              </h2>
              <p className="text-neutral-500">{effectiveUser.email}</p>
              <div className="mt-3">
                <Button variant="outline" size="sm" className="mr-2">
                  <User className="h-4 w-4 mr-1" />
                  Editar perfil
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-medium mb-4">Preferencias</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {darkMode ? <Moon className="h-5 w-5 text-neutral-700" /> : <Sun className="h-5 w-5 text-neutral-700" />}
                  <div>
                    <p className="font-medium">Modo oscuro</p>
                    <p className="text-sm text-neutral-500">Cambia la apariencia de la aplicación</p>
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={handleDarkModeChange} />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-neutral-700" />
                  <div>
                    <p className="font-medium">Notificaciones</p>
                    <p className="text-sm text-neutral-500">Recibe alertas sobre nuevas aplicaciones</p>
                  </div>
                </div>
                <Switch checked={notifications} onCheckedChange={handleNotificationsChange} />
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <Globe className="h-5 w-5 text-neutral-700" />
                  <div>
                    <p className="font-medium">Idioma</p>
                    <p className="text-sm text-neutral-500">Selecciona el idioma de la aplicación</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-8">
                  <Button 
                    variant={language === "es" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleLanguageChange("es")}
                  >
                    Español
                  </Button>
                  <Button 
                    variant={language === "en" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleLanguageChange("en")}
                  >
                    English
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden mt-6">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-medium mb-4">Seguridad</h3>
            
            <div className="space-y-6">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-5 w-5 mr-2" />
                Cambiar contraseña
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>AppHub v1.0.0</p>
          <p className="mt-1">© 2025 AppHub. Todos los derechos reservados.</p>
        </div>
      </div>
    </Layout>
  );
}