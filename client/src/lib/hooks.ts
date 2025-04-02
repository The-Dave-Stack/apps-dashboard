// Re-export las funciones de autenticación
export { 
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logout,
  getCurrentUser
} from "./auth";

// Hook para comprobar si un usuario está autenticado
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import type { User } from "firebase/auth";

// Hook para gestionar el estado de autenticación
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    // Limpieza al desmontar
    return () => unsubscribe();
  }, []);

  return { user, loading };
}

// Por compatibilidad con el código existente, exponemos useAuth como un alias de useAuthState
export const useAuth = useAuthState;
