/**
 * @fileoverview Módulo de inicialización de Firebase para Bookmark Manager Sync
 * Este módulo maneja la inicialización de los servicios de Firebase y proporciona
 * un singleton para acceder a las instancias de Firebase en toda la aplicación.
 * @module firebase-init
 */

import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

/**
 * Variables para implementar el patrón Singleton
 * @private
 */
let initialized = false;
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDB: Firestore | null = null;

/**
 * Configuración de Firebase usando variables de entorno
 * @const {object} firebaseConfig
 * @private
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Opciones adicionales para mejorar la estabilidad
  experimentalForceLongPolling: true,
};

/**
 * Interfaz que define las instancias de Firebase utilizadas en la aplicación
 * @interface FirebaseInstances
 * @property {FirebaseApp} app - La instancia principal de la aplicación Firebase
 * @property {Auth} auth - La instancia de autenticación de Firebase
 * @property {Firestore} db - La instancia de Firestore (base de datos)
 */
interface FirebaseInstances {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

/**
 * Inicializa Firebase y devuelve las instancias de Firebase
 * Implementa el patrón Singleton para garantizar una única inicialización.
 * 
 * @returns {FirebaseInstances} Objeto con las instancias de Firebase (app, auth, db)
 * @throws {Error} Si la inicialización falla o si las instancias no están disponibles
 * @example
 * // Obtener instancias de Firebase
 * const { app, auth, db } = getFirebaseInstances();
 * 
 * // Usar Firestore
 * const usersRef = collection(db, 'users');
 */
export function getFirebaseInstances(): FirebaseInstances {
  if (!initialized) {
    try {
      // Verificar que las variables de entorno necesarias estén definidas
      if (!import.meta.env.VITE_FIREBASE_API_KEY || 
          !import.meta.env.VITE_FIREBASE_PROJECT_ID || 
          !import.meta.env.VITE_FIREBASE_APP_ID) {
        console.error("Error: Faltan variables de entorno para Firebase.");
        console.error("Por favor, crea un archivo .env con las variables mencionadas en .env.example");
        throw new Error("Configuración de Firebase incompleta. Verifica el archivo .env");
      }
      
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
  
  // Verificación de seguridad: las variables deberían estar inicializadas
  if (!firebaseApp || !firebaseAuth || !firebaseDB) {
    throw new Error("Firebase no se inicializó correctamente");
  }
  
  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firebaseDB
  };
}