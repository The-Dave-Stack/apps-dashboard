/**
 * @fileoverview Diagnostic utilities to check Firebase connection
 * This module provides functions to verify the availability and status
 * of Firebase services, including Firestore and Authentication.
 * @module lib/firebase-check
 */

import { getFirebaseInstances } from './firebase-init';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { getCurrentUser } from "./auth";

/**
 * Interface that defines the result of Firebase check
 * @interface FirebaseCheckResult
 * @property {boolean} connection - Indicates if a connection could be established with Firebase
 * @property {boolean} read - Indicates if data could be read from Firestore
 * @property {boolean} write - Indicates if data could be written to Firestore
 * @property {boolean} auth - Indicates if there is an authenticated user
 * @property {string} [error] - Error message, if any occurred
 */
interface FirebaseCheckResult {
  connection: boolean;
  read: boolean;
  write: boolean;
  auth: boolean;
  error?: string;
}

/**
 * Performs a complete check of the connection and permissions with Firebase.
 * Verifies authentication, connection to Firestore, and read/write permissions.
 * 
 * @async
 * @returns {Promise<FirebaseCheckResult>} Detailed check result
 * @example
 * const checkResult = await checkFirebaseConnection();
 * if (checkResult.connection && checkResult.read && checkResult.write) {
 *   console.log("Firebase is working correctly");
 * } else {
 *   console.error("Problem with Firebase:", checkResult.error);
 * }
 */
export async function checkFirebaseConnection(): Promise<FirebaseCheckResult> {
  const result: FirebaseCheckResult = {
    connection: false,
    read: false,
    write: false,
    auth: false
  };

  try {
    console.log("[Firebase-Check] Starting Firebase check...");
    
    // Check if there is an authenticated user
    const user = getCurrentUser();
    result.auth = !!user;
    console.log("[Firebase-Check] Authentication status:", result.auth ? "Authenticated" : "Not authenticated");
    
    // 1. Get Firebase instances
    const { db } = getFirebaseInstances();
    if (!db) {
      result.error = "Could not initialize Firestore";
      return result;
    }
    
    result.connection = true;
    console.log("[Firebase-Check] Connection to Firebase established successfully");
    
    // 2. Try to read from a real collection first
    try {
      console.log("[Firebase-Check] Attempting to read 'categories' collection...");
      const categoriesCollection = collection(db, "categories");
      await getDocs(categoriesCollection);
      result.read = true;
      console.log("[Firebase-Check] Categories read successful");
    } catch (categoriesError) {
      console.error("[Firebase-Check] Error reading categories:", categoriesError);
      
      // If there's an error with categories, try another collection
      try {
        console.log("[Firebase-Check] Attempting to read 'config' collection...");
        const configDoc = await getDoc(doc(db, "config", "app_config"));
        if (configDoc.exists()) {
          console.log("[Firebase-Check] Configuration read successfully:", configDoc.data());
          result.read = true;
        } else {
          console.log("[Firebase-Check] Configuration document does not exist");
        }
      } catch (configError) {
        console.error("[Firebase-Check] Error reading configuration:", configError);
        if (configError instanceof Error) {
          result.error = `Read error: ${configError.message}`;
        }
      }
    }
    
    // 3. Try to write only if we are authenticated
    if (user) {
      try {
        console.log("[Firebase-Check] Attempting to write test data...");
        // Use a user-specific collection to avoid permission issues
        const testCollection = `user_tests_${user.uid}`;
        const testDoc = doc(collection(db, testCollection));
        await setDoc(testDoc, {
          test: true,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          message: "Write test"
        });
        result.write = true;
        console.log("[Firebase-Check] Write successful");
      } catch (writeError) {
        console.error("[Firebase-Check] Error writing data:", writeError);
        if (writeError instanceof Error) {
          result.error = `Write error: ${writeError.message}`;
        }
      }
    } else {
      console.log("[Firebase-Check] Write not attempted because there is no authenticated user");
      result.error = "You must be logged in to write data to Firestore";
    }
    
    return result;
  } catch (error) {
    console.error("[Firebase-Check] General error in the check:", error);
    if (error instanceof Error) {
      result.error = error.message;
    } else {
      result.error = "Unknown error";
    }
    return result;
  }
}