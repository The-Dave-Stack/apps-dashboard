// Exportamos funciones simples que utilizan directamente los servicios de Firebase
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth } from "./firebase";

// Función para iniciar sesión con email y contraseña
export async function loginWithEmail(email: string, password: string): Promise<User> {
  console.log("Login attempt with:", email);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful");
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Función para registrar un nuevo usuario
export async function registerWithEmail(email: string, password: string): Promise<User> {
  console.log("Register attempt with:", email);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Register successful");
    return userCredential.user;
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
}

// La función loginWithGoogle fue eliminada ya que no se requiere

// Función para cerrar sesión
export async function logout(): Promise<void> {
  console.log("Logout attempt");
  try {
    await signOut(auth);
    console.log("Logout successful");
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

// Función para obtener el usuario actual
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Componente AuthProvider que proporciona autenticación global
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
