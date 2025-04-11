import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader, AlertTriangle, Globe } from "lucide-react";
import { getAppConfig } from "@/lib/appConfig";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { collection, doc, getDoc } from "firebase/firestore";
import { getFirebaseInstances } from "@/lib/firebase-init";
import { useTranslation } from "react-i18next";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showRegisterTab, setShowRegisterTab] = useState(false); // Default to false (hide register tab)
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  
  // Carga la configuración al iniciar
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoadingConfig(true);
        setConfigError(null);
        
        // Intentamos obtener la configuración directamente de Firestore
        // para evitar problemas de permisos con la función getAppConfig
        const { db } = getFirebaseInstances();
        const configRef = collection(db, "appConfig");
        const configDocId = "globalConfig";
        const docRef = doc(configRef, configDocId);
        
        try {
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Valor explícito
            setShowRegisterTab(data.showRegisterTab === true);
            console.log("[Auth] Configuración cargada directamente:", data);
          } else {
            // Si no existe el documento, ocultamos la pestaña de registro por seguridad
            setShowRegisterTab(false);
            console.log("[Auth] No se encontró configuración, ocultando pestaña de registro");
          }
        } catch (firestoreError: any) {
          console.error("Error al obtener configuración directamente:", firestoreError);
          
          // Si hay error de permisos, intentamos con el método normal
          // pero asumimos que si hay error, la pestaña debe estar oculta (seguridad)
          setShowRegisterTab(false);
          setConfigError(firestoreError.message || "Error al cargar la configuración");
          
          if (firestoreError.code === "permission-denied") {
            setConfigError("No tienes permisos para acceder a la configuración. Las reglas de seguridad Firestore podrían necesitar ajustes.");
          }
        }
        
        // Si la pestaña de registro está deshabilitada y estamos en registro, forzar login
        if (!showRegisterTab && !isLogin) {
          setIsLogin(true);
        }
      } catch (error: any) {
        console.error("Error al cargar la configuración:", error);
        setConfigError(error.message || "Error desconocido al cargar la configuración");
        // Si hay error, por defecto ocultamos la pestaña de registro por seguridad
        setShowRegisterTab(false);
        if (!isLogin) setIsLogin(true);
      } finally {
        setLoadingConfig(false);
      }
    };
    
    loadConfig();
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Form submitted:", isLogin ? "login" : "register");

    try {
      if (isLogin) {
        try {
          // Importación dinámica para evitar problemas circulares
          const { loginWithEmail, loginAnonymously } = await import('@/lib/hooks');
          
          // Si es un entorno de desarrollo y se usa una cuenta específica, usamos login anónimo
          if (process.env.NODE_ENV === 'development' && email === 'test@example.com') {
            await loginAnonymously();
          } else {
            await loginWithEmail(email, password);
          }
          
          toast({
            title: t('auth.loginSuccess', 'Login successful'),
            description: t('auth.welcomeBack', 'Welcome back!'),
          });
          
          // Redirigir al dashboard
          navigate("/");
        } catch (loginError: any) {
          console.error("Login error:", loginError);
          toast({
            title: t('errors.loginFailed', 'Login failed'),
            description: loginError.message || t('errors.loginCredentials', 'Could not log in. Check your credentials.'),
            variant: "destructive",
          });
          setIsLoading(false);
        }
      } else {
        // Verificación de registro
        if (password !== confirmPassword) {
          toast({
            title: t('errors.passwordMismatch', 'Error'),
            description: t('errors.confirmPasswordMatch', 'Passwords do not match'),
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        try {
          // Importación dinámica para evitar problemas circulares
          const { registerWithEmail } = await import('@/lib/hooks');
          await registerWithEmail(email, password);
          
          toast({
            title: t('auth.registerSuccess', 'Registration successful'),
            description: t('auth.accountCreated', 'Your account has been created'),
          });
          
          // Redirigir al dashboard
          navigate("/");
        } catch (registerError: any) {
          console.error("Registration error:", registerError);
          toast({
            title: t('errors.registrationFailed', 'Registration failed'),
            description: registerError.message || t('errors.registrationError', 'Registration could not be completed.'),
            variant: "destructive",
          });
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: t('errors.authFailed', 'Authentication error'),
        description: error.message || t('errors.genericAuth', 'Authentication failed'),
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      {loadingConfig ? (
        <div className="flex flex-col items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary-600 mb-2" />
          <span className="text-neutral-600">{t('common.loading', 'Loading...')}</span>
        </div>
      ) : (
        <Card className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="px-6 py-8">
              <div className="text-center mb-6">
                <div className="flex justify-end mb-2">
                  <Select
                    value={i18n.language}
                    onValueChange={(value) => i18n.changeLanguage(value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <Globe className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <h1 className="text-3xl font-bold text-primary-600">Bookmark Manager Sync</h1>
                <p className="text-neutral-500 mt-2">{t('auth.welcome', 'Welcome to Bookmark Manager Sync')}</p>
              </div>
              
              {configError && (
                <Alert className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-800" />
                  <AlertDescription className="text-xs">
                    {configError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Toggle between Login and Register */}
              <div className="flex border-b border-neutral-200 mb-6">
                <button 
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 font-medium text-center ${isLogin ? 'border-b-2 border-primary-500 text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  {t('auth.loginTab', 'Login')}
                </button>
                {showRegisterTab && (
                  <button 
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-3 font-medium text-center ${!isLogin ? 'border-b-2 border-primary-500 text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    {t('auth.registerTab', 'Register')}
                  </button>
                )}
              </div>

              {/* Login Form */}
              {isLogin ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-neutral-700">{t('auth.email', 'Email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.emailPlaceholder', 'your@email.com')}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-neutral-700">{t('auth.password', 'Password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="remember-me" 
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)} 
                      />
                      <Label htmlFor="remember-me" className="text-sm text-neutral-700">{t('auth.rememberMe', 'Remember me')}</Label>
                    </div>
                    <a href="#" className="text-sm font-medium text-primary-600 hover:underline">{t('auth.forgotPassword', 'Forgot password?')}</a>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm transition-colors" 
                    disabled={isLoading}
                  >
                    {isLoading ? t('auth.loggingIn', 'Logging in...') : t('auth.loginButton', 'Login')}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-neutral-700">{t('auth.fullName', 'Full Name')}</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('auth.namePlaceholder', 'John Doe')}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-email" className="text-neutral-700">{t('auth.email', 'Email')}</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.emailPlaceholder', 'your@email.com')}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-password" className="text-neutral-700">{t('auth.password', 'Password')}</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password" className="text-neutral-700">{t('auth.confirmPassword', 'Confirm Password')}</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary-600 hover:bg-primary-700" 
                    disabled={isLoading}
                  >
                    {isLoading ? t('auth.creatingAccount', 'Creating account...') : t('auth.registerButton', 'Register')}
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}