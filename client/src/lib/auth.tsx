import { 
  createContext, 
  useEffect, 
  useState, 
  ReactNode 
} from "react";
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "./firebase";

// Auth context interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
}

// Create the auth context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => Promise.reject(new Error("AuthContext not initialized")),
  register: () => Promise.reject(new Error("AuthContext not initialized")),
  loginWithGoogle: () => Promise.reject(new Error("AuthContext not initialized")),
  logout: () => Promise.reject(new Error("AuthContext not initialized")),
});

// Auth provider component props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Login function with email/password
  const login = async (email: string, password: string): Promise<User> => {
    console.log("Login attempt with email/password:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful for:", userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Register function
  const register = async (email: string, password: string): Promise<User> => {
    console.log("Register attempt with email/password:", email);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Registration successful for:", userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };
  
  // Login with Google
  const loginWithGoogle = async (): Promise<User> => {
    console.log("Google login attempt");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("Google login successful for:", result.user.email);
      return result.user;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    console.log("Logout attempt");
    try {
      await signOut(auth);
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Provide auth context to children
  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
