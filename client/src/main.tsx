import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/customStyles.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./lib/auth";
// Import i18n configuration
import "./i18n";
import { LanguageProvider } from "./i18n/LanguageContext";
// Import environment variables verification
import { logFirebaseEnvStatus } from "./lib/env-check";

// Verify Firebase environment variables
logFirebaseEnvStatus();

// Firebase initialization at the application root
console.log("Initializing React application");

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
