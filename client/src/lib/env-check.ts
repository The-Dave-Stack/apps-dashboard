/**
 * @fileoverview Utilidad para verificar las variables de entorno de Firebase
 * Este módulo proporciona una función para comprobar y mostrar el estado de las
 * variables de entorno necesarias para la configuración de Firebase.
 * @module lib/env-check
 */

/**
 * Interfaz que define el resultado de la comprobación de variables de entorno
 * @interface EnvCheckResult
 * @property {boolean} allPresent - Indica si todas las variables requeridas están presentes
 * @property {string[]} missing - Array con los nombres de las variables que faltan
 * @property {Record<string, boolean>} status - Estado de cada variable (presente o no)
 */
interface EnvCheckResult {
  allPresent: boolean;
  missing: string[];
  status: Record<string, boolean>;
}

/**
 * Variables de entorno requeridas para configurar Firebase
 * @const {string[]} REQUIRED_ENV_VARS
 */
const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

/**
 * Comprueba si todas las variables de entorno requeridas para Firebase están presentes
 * 
 * @returns {EnvCheckResult} Resultado de la comprobación con detalles sobre las variables faltantes
 * @example
 * const envStatus = checkFirebaseEnvVars();
 * if (!envStatus.allPresent) {
 *   console.error("Faltan variables de entorno:", envStatus.missing.join(", "));
 * }
 */
export function checkFirebaseEnvVars(): EnvCheckResult {
  const status: Record<string, boolean> = {};
  const missing: string[] = [];
  
  // Comprobar cada variable requerida
  REQUIRED_ENV_VARS.forEach(varName => {
    const isPresent = import.meta.env[varName] !== undefined && 
                       import.meta.env[varName] !== "";
    
    status[varName] = isPresent;
    
    if (!isPresent) {
      missing.push(varName);
    }
  });
  
  return {
    allPresent: missing.length === 0,
    missing,
    status
  };
}

/**
 * Muestra en la consola el estado de las variables de entorno de Firebase
 * Útil para depuración durante el desarrollo local
 * 
 * @returns {void}
 * @example
 * // Llamar al inicio de la aplicación para verificar la configuración
 * logFirebaseEnvStatus();
 */
export function logFirebaseEnvStatus(): void {
  const result = checkFirebaseEnvVars();
  
  console.group("🔥 Firebase Environment Variables Status:");
  console.log(`✅ All required variables present: ${result.allPresent}`);
  
  if (result.missing.length > 0) {
    console.warn("⚠️ Missing variables:", result.missing.join(", "));
    console.log("🔍 Please check that you have created a .env file with these variables");
    console.log("📄 You can copy .env.example to .env and fill in the values");
  }
  
  console.log("📊 Status for each variable:");
  Object.entries(result.status).forEach(([varName, isPresent]) => {
    const icon = isPresent ? "✅" : "❌";
    console.log(`${icon} ${varName}: ${isPresent}`);
  });
  
  console.groupEnd();
}