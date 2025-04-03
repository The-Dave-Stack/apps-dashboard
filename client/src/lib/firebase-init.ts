import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Variable para controlar inicialización única
let initialized = false;
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDB: Firestore | null = null;

// Configuración de Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Opciones adicionales para mejorar la estabilidad
  experimentalForceLongPolling: true,
};

interface FirebaseInstances {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

/**
 * Inicializa Firebase y devuelve las instancias de Firebase
 * Solo se inicializa una vez
 */
export function getFirebaseInstances(): FirebaseInstances {
  if (!initialized) {
    try {
      console.log("Inicializando Firebase por primera vez:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
      firebaseApp = initializeApp(firebaseConfig);
      firebaseAuth = getAuth(firebaseApp);
      firebaseDB = getFirestore(firebaseApp);
      initialized = true;
      console.log("Firebase inicializado correctamente");
    } catch (error) {
      console.error("Error al inicializar Firebase:", error);
      throw error;
    }
  }
  
  // En este punto, las variables deberían estar inicializadas
  if (!firebaseApp || !firebaseAuth || !firebaseDB) {
    throw new Error("Firebase no se inicializó correctamente");
  }
  
  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firebaseDB
  };
}