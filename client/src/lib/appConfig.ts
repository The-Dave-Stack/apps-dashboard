/**
 * @fileoverview Gestión de configuración global de la aplicación Bookmark Manager Sync
 * Este módulo proporciona funciones para obtener y actualizar la configuración
 * global de la aplicación, almacenada en Firestore.
 * @module lib/appConfig
 */

import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseInstances } from "./firebase-init";

/**
 * Interfaz que define la estructura de la configuración global de la aplicación
 * @interface AppConfig
 * @property {boolean} showRegisterTab - Indica si se debe mostrar la pestaña de registro en la interfaz de autenticación
 */
export interface AppConfig {
  showRegisterTab: boolean;
}

/**
 * Configuración predeterminada que se utiliza cuando no hay configuración guardada en Firestore
 * o cuando ocurre un error al intentar obtenerla
 * @const {AppConfig} DEFAULT_CONFIG
 */
const DEFAULT_CONFIG: AppConfig = {
  showRegisterTab: false
};

// Obtenemos la instancia de Firestore mediante el patrón Singleton
const { db } = getFirebaseInstances();

/**
 * Referencias a la colección y documento de configuración en Firestore
 */
const configRef = collection(db, "appConfig");
const configDocId = "globalConfig";

/**
 * Obtiene la configuración global de la aplicación desde Firestore.
 * Si no existe la configuración, crea un documento con los valores predeterminados.
 * En caso de error, devuelve la configuración predeterminada.
 * 
 * @async
 * @returns {Promise<AppConfig>} La configuración de la aplicación
 * @example
 * // Obtener configuración y usarla para mostrar/ocultar la pestaña de registro
 * const config = await getAppConfig();
 * if (config.showRegisterTab) {
 *   // Mostrar la pestaña de registro
 * } else {
 *   // Ocultar la pestaña de registro
 * }
 */
export async function getAppConfig(): Promise<AppConfig> {
  try {
    const docRef = doc(configRef, configDocId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as AppConfig;
      return { ...DEFAULT_CONFIG, ...data };
    } else {
      // Si no existe, crear con valores predeterminados
      await setDoc(docRef, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Actualiza la configuración global de la aplicación en Firestore.
 * Combina la configuración actual con los nuevos valores proporcionados.
 * 
 * @async
 * @param {Partial<AppConfig>} config - Valores de configuración a actualizar (parciales)
 * @returns {Promise<AppConfig>} La configuración actualizada completa
 * @throws {Error} Si ocurre un error al intentar actualizar la configuración
 * @example
 * // Actualizar la configuración para ocultar la pestaña de registro
 * const updatedConfig = await updateAppConfig({ showRegisterTab: false });
 * console.log("Nueva configuración:", updatedConfig);
 */
export async function updateAppConfig(config: Partial<AppConfig>): Promise<AppConfig> {
  try {
    const docRef = doc(configRef, configDocId);
    
    // Obtener configuración actual
    const currentConfig = await getAppConfig();
    
    // Combinar configuración actual con nuevos valores
    const updatedConfig = {
      ...currentConfig,
      ...config
    };
    
    // Guardar configuración actualizada
    await setDoc(docRef, updatedConfig);
    
    return updatedConfig;
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    throw error;
  }
}