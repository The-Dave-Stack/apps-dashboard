import { Switch, Route } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";

// Una versión simple de la página de Dashboard
function Dashboard() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-blue-600">AppHub Dashboard</CardTitle>
          <CardDescription className="text-center">Your application dashboard</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">¡Bienvenido al dashboard!</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-3 rounded shadow">
              <h3 className="font-semibold text-blue-500">Aplicaciones</h3>
              <p className="text-sm text-gray-600">Gestiona tus apps</p>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <h3 className="font-semibold text-blue-500">Usuarios</h3>
              <p className="text-sm text-gray-600">Administra usuarios</p>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <h3 className="font-semibold text-blue-500">Estadísticas</h3>
              <p className="text-sm text-gray-600">Ver analíticas</p>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <h3 className="font-semibold text-blue-500">Configuración</h3>
              <p className="text-sm text-gray-600">Personaliza la app</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => alert('¡Dashboard funcionando!')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continuar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Una versión simple de la página de Login
function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-blue-600">AppHub Login</CardTitle>
          <CardDescription className="text-center">Inicia sesión para acceder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input 
              id="email" 
              type="email" 
              className="w-full p-2 border rounded" 
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
            <input 
              id="password" 
              type="password" 
              className="w-full p-2 border rounded" 
              placeholder="••••••••"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Registrarse</Button>
          <Button 
            onClick={() => window.location.href = "/dashboard"} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Iniciar Sesión
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Componente de Router simple
function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route>
        <div className="flex items-center justify-center h-screen bg-blue-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-red-600">404 - Página no encontrada</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p>Lo sentimos, la página que buscas no existe.</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                onClick={() => window.location.href = "/"} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Volver al inicio
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Route>
    </Switch>
  );
}

// Componente principal App
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
