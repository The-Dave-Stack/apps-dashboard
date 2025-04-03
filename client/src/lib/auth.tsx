// Exportamos funciones simples que utilizan directamente los servicios de Firebase
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously
} from "firebase/auth";
import { getFirebaseInstances } from "./firebase-init";

// Obtenemos la instancia de autenticación de Firebase
const { auth } = getFirebaseInstances();

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

// Función para iniciar sesión anónima (útil para desarrollo)
export async function loginAnonymously(): Promise<User> {
  console.log("Anonymous login attempt");
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("Anonymous login successful");
    return userCredential.user;
  } catch (error) {
    console.error("Anonymous login error:", error);
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
