import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/customStyles.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./lib/auth";

// Inicialización de Firebase en la raíz de la aplicación
console.log("Initializing React application");

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
);
