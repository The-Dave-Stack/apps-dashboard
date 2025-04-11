/**
 * @fileoverview Firebase SDK initialization for server
 * This module provides a function to get Firebase instances
 * configured for server-side use.
 * @module lib/firebase-init
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Function that returns the Firebase instances needed for the server
export function getFirebaseInstances() {
  // Verify if there's already an initialized app
  if (getApps().length === 0) {
    // If no service account is configured, try using environment credentials
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'appsdashboard-ef2e1',
    };

    // If credentials are defined as an environment variable, use them
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({
          credential: cert(serviceAccount),
        });
      } catch (error) {
        console.error('Error initializing Firebase with service account:', error);
        // Silently fail to basic initialization
        initializeApp(firebaseConfig);
      }
    } else {
      // Basic initialization for development environments or when there's no service account
      initializeApp(firebaseConfig);
    }
  }

  // Get and return the necessary instances
  const db = getFirestore();
  const auth = getAuth();

  return {
    db,
    auth
  };
}