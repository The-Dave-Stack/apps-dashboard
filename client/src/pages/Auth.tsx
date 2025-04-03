import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader, AlertTriangle } from "lucide-react";
import { getAppConfig } from "@/lib/appConfig";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { collection, doc, getDoc } from "firebase/firestore";
import { getFirebaseInstances } from "@/lib/firebase-init";

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
            title: "Inicio de sesión exitoso",
            description: "¡Bienvenido de nuevo!",
          });
          
          // Redirigir al dashboard
          navigate("/");
        } catch (loginError: any) {
          console.error("Login error:", loginError);
          toast({
            title: "Error de inicio de sesión",
            description: loginError.message || "No se pudo iniciar sesión. Verifica tus credenciales.",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      } else {
        // Verificación de registro
        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Las contraseñas no coinciden",
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
            title: "Registro exitoso",
            description: "Tu cuenta ha sido creada",
          });
          
          // Redirigir al dashboard
          navigate("/");
        } catch (registerError: any) {
          console.error("Registration error:", registerError);
          toast({
            title: "Error de registro",
            description: registerError.message || "No se pudo completar el registro.",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Error de autenticación",
        description: error.message || "Fallo al autenticar",
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
          <span className="text-neutral-600">Cargando...</span>
        </div>
      ) : (
        <Card className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="px-6 py-8">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-primary-600">AppHub</h1>
                <p className="text-neutral-500 mt-2">Accede a todas tus aplicaciones favoritas en un solo lugar</p>
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
                  Iniciar Sesión
                </button>
                {showRegisterTab && (
                  <button 
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-3 font-medium text-center ${!isLogin ? 'border-b-2 border-primary-500 text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Registrarse
                  </button>
                )}
              </div>

              {/* Login Form */}
              {isLogin ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-neutral-700">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-neutral-700">Contraseña</Label>
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
                      <Label htmlFor="remember-me" className="text-sm text-neutral-700">Recordarme</Label>
                    </div>
                    <a href="#" className="text-sm font-medium text-primary-600 hover:underline">¿Olvidaste tu contraseña?</a>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary-600 hover:bg-primary-700" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-neutral-700">Nombre Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Juan Pérez"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-email" className="text-neutral-700">Correo Electrónico</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-password" className="text-neutral-700">Contraseña</Label>
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
                    <Label htmlFor="confirm-password" className="text-neutral-700">Confirmar Contraseña</Label>
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
                    {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
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