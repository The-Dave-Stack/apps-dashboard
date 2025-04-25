/**
 * @fileoverview Firebase Initialization Module for Bookmark Manager Sync
 * This module handles the initialization of Firebase services and provides
 * a singleton to access Firebase instances throughout the application.
 * @module firebase-init
 */

import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

/**
 * Variables to implement the Singleton pattern
 * @private
 */
let initialized = false;
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDB: Firestore | null = null;

/**
 * Firebase configuration using environment variables
 * @const {object} firebaseConfig
 * @private
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Additional options to improve stability
  experimentalForceLongPolling: true,
};

/**
 * Interface that defines the Firebase instances used in the application
 * @interface FirebaseInstances
 * @property {FirebaseApp} app - The main Firebase application instance
 * @property {Auth} auth - The Firebase authentication instance
 * @property {Firestore} db - The Firestore (database) instance
 */
interface FirebaseInstances {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

/**
 * Initializes Firebase and returns the Firebase instances
 * Implements the Singleton pattern to ensure a single initialization.
 * 
 * @returns {FirebaseInstances} Object with Firebase instances (app, auth, db)
 * @throws {Error} If initialization fails or if instances are not available
 * @example
 * // Get Firebase instances
 * const { app, auth, db } = getFirebaseInstances();
 * 
 * // Use Firestore
 * const usersRef = collection(db, 'users');
 */
export function getFirebaseInstances(): FirebaseInstances {
  if (!initialized) {
    try {
      // Verify that the necessary environment variables are defined
      if (!import.meta.env.VITE_FIREBASE_API_KEY || 
          !import.meta.env.VITE_FIREBASE_PROJECT_ID || 
          !import.meta.env.VITE_FIREBASE_APP_ID) {
        console.error("Error: Missing environment variables for Firebase.");
        console.error("Please create a .env file with the variables mentioned in .env.example");
        throw new Error("Incomplete Firebase configuration. Check the .env file");
      }
      
      console.log("Initializing Firebase for the first time:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
      firebaseApp = initializeApp(firebaseConfig);
      firebaseAuth = getAuth(firebaseApp);
      firebaseDB = getFirestore(firebaseApp);
      initialized = true;
      console.log("Firebase initialized successfully");
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      throw error;
    }
  }
  
  // Security check: variables should be initialized
  if (!firebaseApp || !firebaseAuth || !firebaseDB) {
    throw new Error("Firebase was not initialized correctly");
  }
  
  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firebaseDB
  };
}