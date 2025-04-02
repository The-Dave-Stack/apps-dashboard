import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { loginWithEmail, registerWithEmail, useAuthState } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loading } = useAuthState();

  console.log("Auth component rendered, user:", user ? "logged in" : "not logged in");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log("User is already logged in, redirecting to dashboard");
      setLocation("/");
    }
  }, [user, setLocation]);

  // Si estamos cargando, mostramos un indicador de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
        <div className="h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si el usuario ya está autenticado, no renderizamos nada (se redirigirá por el efecto)
  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Form submitted:", isLogin ? "login" : "register");

    try {
      if (isLogin) {
        // Login using the function
        console.log("Attempting login with:", email);
        await loginWithEmail(email, password);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      } else {
        // Register
        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        console.log("Attempting registration with:", email);
        await registerWithEmail(email, password);
        
        toast({
          title: "Registration successful",
          description: "Your account has been created",
        });
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <Card className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="px-6 py-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-primary-600">AppHub</h1>
              <p className="text-neutral-500 mt-2">Access all your favorite web apps in one place</p>
            </div>

            {/* Toggle between Login and Register */}
            <div className="flex border-b border-neutral-200 mb-6">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 font-medium text-center ${isLogin ? 'border-b-2 border-primary-500 text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 font-medium text-center ${!isLogin ? 'border-b-2 border-primary-500 text-primary-600' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Register
              </button>
            </div>

            {/* Login Form */}
            {isLogin ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-neutral-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-neutral-700">Password</Label>
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
                    <Label htmlFor="remember-me" className="text-sm text-neutral-700">Remember me</Label>
                  </div>
                  <a href="#" className="text-sm font-medium text-primary-600 hover:underline">Forgot password?</a>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary-600 hover:bg-primary-700" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-neutral-700">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-email" className="text-neutral-700">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password" className="text-neutral-700">Password</Label>
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
                  <Label htmlFor="confirm-password" className="text-neutral-700">Confirm Password</Label>
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
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
