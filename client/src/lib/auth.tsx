// Exporting simple functions that directly use Firebase services
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously
} from "firebase/auth";
import { getFirebaseInstances } from "./firebase-init";

// Get Firebase authentication instance
const { auth } = getFirebaseInstances();

// Function to sign in with email and password
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

// Function for anonymous login (useful for development)
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

// Function to register a new user
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

// Function to sign out
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

// Function to get the current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// AuthProvider component that provides global authentication
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
