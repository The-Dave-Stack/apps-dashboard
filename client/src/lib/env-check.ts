/**
 * @fileoverview Utility to verify Firebase environment variables
 * This module provides a function to check and display the status of the
 * environment variables needed for Firebase configuration.
 * @module lib/env-check
 */

/**
 * Interface that defines the result of environment variables check
 * @interface EnvCheckResult
 * @property {boolean} allPresent - Indicates if all required variables are present
 * @property {string[]} missing - Array with the names of missing variables
 * @property {Record<string, boolean>} status - Status of each variable (present or not)
 */
interface EnvCheckResult {
  allPresent: boolean;
  missing: string[];
  status: Record<string, boolean>;
}

/**
 * Environment variables required to configure Firebase
 * @const {string[]} REQUIRED_ENV_VARS
 */
const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

/**
 * Checks if all required environment variables for Firebase are present
 * 
 * @returns {EnvCheckResult} Check result with details about missing variables
 * @example
 * const envStatus = checkFirebaseEnvVars();
 * if (!envStatus.allPresent) {
 *   console.error("Missing environment variables:", envStatus.missing.join(", "));
 * }
 */
export function checkFirebaseEnvVars(): EnvCheckResult {
  const status: Record<string, boolean> = {};
  const missing: string[] = [];
  
  // Check each required variable
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
 * Displays in the console the status of Firebase environment variables
 * Useful for debugging during local development
 * 
 * @returns {void}
 * @example
 * // Call at the start of the application to verify the configuration
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