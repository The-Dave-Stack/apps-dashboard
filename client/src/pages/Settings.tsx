import { useState, useEffect } from "react";
import { Settings as SettingsIcon, User, Bell, Moon, Sun, Globe, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/hooks";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/lib/auth";
import { useLocation } from "wouter";
import { getTheme, setTheme, toggleTheme, type Theme } from "@/lib/theme-service";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  
  // Estados para las configuraciones
  const [darkMode, setDarkMode] = useState<boolean>(false);
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
  
  // Cargar la configuración del tema al iniciar
  useEffect(() => {
    const currentTheme = getTheme();
    setDarkMode(currentTheme === 'dark');
  }, []);
  
  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: t('settings.sessionClosed'),
        description: t('settings.sessionClosedSuccess'),
      });
      setLocation("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({
        title: t('common.error'),
        description: t('settings.logoutError'),
        variant: "destructive",
      });
    }
  };
  
  // Manejadores para cambios en configuraciones
  const handleDarkModeChange = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    setTheme(newDarkMode ? 'dark' : 'light');
    toast({
      title: newDarkMode ? t('settings.darkModeEnabled') : t('settings.lightModeEnabled'),
      description: t('settings.settingsSaved')
    });
  };
  
  const handleNotificationsChange = () => {
    setNotifications(!notifications);
    toast({
      title: !notifications ? t('settings.notificationsEnabled') : t('settings.notificationsDisabled'),
      description: t('settings.settingsSaved')
    });
  };
  
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    toast({
      title: t('settings.languageChanged'),
      description: t('settings.languageChangedTo', { language: lang === 'es' ? t('settings.languages.es') : t('settings.languages.en') })
    });
  };

  // Inicializar el idioma correcto una vez
  useEffect(() => {
    setLanguage(i18n.language);
  }, [i18n.language]);

  return (
    <>
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>
      
      {/* Settings Content */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-lg border border-border overflow-hidden mb-6">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-muted overflow-hidden flex-shrink-0">
              {effectiveUser?.photoURL ? (
                <img 
                  src={effectiveUser.photoURL} 
                  alt={t('common.user')} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-2xl font-medium text-primary">
                    {effectiveUser.email ? effectiveUser.email[0].toUpperCase() : "U"}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-card-foreground">
                {effectiveUser.displayName || t('common.user')}
              </h2>
              <p className="text-muted-foreground">{effectiveUser.email}</p>
              <div className="mt-3">
                <Button variant="outline" size="sm" className="mr-2">
                  <User className="h-4 w-4 mr-1" />
                  {t('settings.profile')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-medium mb-4 text-card-foreground">{t('settings.preferences')}</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                  <div>
                    <p className="font-medium text-card-foreground">{t('settings.theme')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.appearance')}</p>
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={handleDarkModeChange} />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-card-foreground">{t('settings.notifications')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.notificationsDesc')}</p>
                  </div>
                </div>
                <Switch checked={notifications} onCheckedChange={handleNotificationsChange} />
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-card-foreground">{t('settings.language')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.languageSettings')}</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-8">
                  <Button 
                    variant={language === "es" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleLanguageChange("es")}
                  >
                    {t('settings.languages.es')}
                  </Button>
                  <Button 
                    variant={language === "en" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleLanguageChange("en")}
                  >
                    {t('settings.languages.en')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border overflow-hidden mt-6">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-medium mb-4 text-card-foreground">{t('settings.security')}</h3>
            
            <div className="space-y-6">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-5 w-5 mr-2" />
                {t('settings.changePassword')}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-2" />
                {t('settings.logout')}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>AppHub v1.0.0</p>
          <p className="mt-1">{t('settings.copyright')}</p>
        </div>
      </div>
    </>
  );
}