/**
 * @fileoverview Inicialización del SDK de Firebase para el servidor
 * Este módulo proporciona una función para obtener instancias de Firebase
 * configuradas para su uso en el servidor.
 * @module lib/firebase-init
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Función que devuelve las instancias de Firebase necesarias para el servidor
export function getFirebaseInstances() {
  // Verifica si ya hay una app inicializada
  if (getApps().length === 0) {
    // Si no hay service account configurado, intentar usar credenciales de entorno
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'appsdashboard-ef2e1',
    };

    // Si hay credenciales definidas como variable de entorno, usarlas
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({
          credential: cert(serviceAccount),
        });
      } catch (error) {
        console.error('Error al inicializar Firebase con service account:', error);
        // Fallar silenciosamente a la inicialización básica
        initializeApp(firebaseConfig);
      }
    } else {
      // Inicialización básica para entornos de desarrollo o cuando no hay service account
      initializeApp(firebaseConfig);
    }
  }

  // Obtener y devolver las instancias necesarias
  const db = getFirestore();
  const auth = getAuth();

  return {
    db,
    auth
  };
}