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
    console.log("[Firebase-Check] Iniciando comprobación de Firebase...");
    
    // Verificamos si hay un usuario autenticado
    const user = getCurrentUser();
    result.auth = !!user;
    console.log("[Firebase-Check] Estado de autenticación:", result.auth ? "Autenticado" : "No autenticado");
    
    // 1. Obtenemos las instancias de Firebase
    const { db } = getFirebaseInstances();
    if (!db) {
      result.error = "No se pudo inicializar Firestore";
      return result;
    }
    
    result.connection = true;
    console.log("[Firebase-Check] Conexión a Firebase establecida correctamente");
    
    // 2. Intentamos leer de una colección real primero
    try {
      console.log("[Firebase-Check] Intentando leer colección 'categories'...");
      const categoriesCollection = collection(db, "categories");
      await getDocs(categoriesCollection);
      result.read = true;
      console.log("[Firebase-Check] Lectura de categorías exitosa");
    } catch (categoriesError) {
      console.error("[Firebase-Check] Error al leer categorías:", categoriesError);
      
      // Si hay error en categorías, intentamos con otra colección
      try {
        console.log("[Firebase-Check] Intentando leer colección 'config'...");
        const configDoc = await getDoc(doc(db, "config", "app_config"));
        if (configDoc.exists()) {
          console.log("[Firebase-Check] Configuración leída correctamente:", configDoc.data());
          result.read = true;
        } else {
          console.log("[Firebase-Check] No existe documento de configuración");
        }
      } catch (configError) {
        console.error("[Firebase-Check] Error al leer configuración:", configError);
        if (configError instanceof Error) {
          result.error = `Error de lectura: ${configError.message}`;
        }
      }
    }
    
    // 3. Intentamos escribir solo si estamos autenticados
    if (user) {
      try {
        console.log("[Firebase-Check] Intentando escribir datos de prueba...");
        // Usamos una colección específica para el usuario para evitar problemas de permisos
        const testCollection = `user_tests_${user.uid}`;
        const testDoc = doc(collection(db, testCollection));
        await setDoc(testDoc, {
          test: true,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          message: "Prueba de escritura"
        });
        result.write = true;
        console.log("[Firebase-Check] Escritura exitosa");
      } catch (writeError) {
        console.error("[Firebase-Check] Error al escribir datos:", writeError);
        if (writeError instanceof Error) {
          result.error = `Error de escritura: ${writeError.message}`;
        }
      }
    } else {
      console.log("[Firebase-Check] No se intentó escribir porque no hay usuario autenticado");
      result.error = "Debes iniciar sesión para poder escribir datos en Firestore";
    }
    
    return result;
  } catch (error) {
    console.error("[Firebase-Check] Error general en la comprobación:", error);
    if (error instanceof Error) {
      result.error = error.message;
    } else {
      result.error = "Error desconocido";
    }
    return result;
  }
}