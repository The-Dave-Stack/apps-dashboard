/**
 * @fileoverview Firebase Storage Implementation for Bookmark Manager Sync
 * This module implements the IStorage interface using Firebase as a backend.
 * @module storage/FirebaseStorage
 */

import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseInstances } from '../lib/firebase-init';
import { IStorage } from './IStorage';
import { FirebaseCategory, FirebaseApp, FirebaseUser, UserRole } from '@shared/schema';
import crypto from 'crypto';

/**
 * Storage implementation using Firebase/Firestore
 * @class FirebaseStorage
 * @implements {IStorage}
 */
export class FirebaseStorage implements IStorage {
  private db: ReturnType<typeof getFirebaseInstances>['db'];
  
  constructor() {
    const { db } = getFirebaseInstances();
    this.db = db;
  }
  
  /**
   * Gets all categories for a specific user
   * @param userId - User ID
   * @returns Promise with array of categories
   */
  async getCategories(userId: string): Promise<FirebaseCategory[]> {
    try {
      console.log(`[Firebase] Getting categories for user: ${userId}`);
      const categoriesRef = this.db.collection(`users/${userId}/categories`);
      const snapshot = await categoriesRef.get();
      const categories: FirebaseCategory[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<FirebaseCategory, 'id'>;
        categories.push({
          id: doc.id,
          name: String(data.name),
          apps: data.apps || [],
        });
      });

      console.log(`[Firebase] Found ${categories.length} categories for user ${userId}`);
      return categories;
    } catch (error) {
      console.error('[Firebase] Error getting categories:', error);
      throw error;
    }
  }
  
  /**
   * Gets a specific category by its ID
   * @param userId - User ID
   * @param categoryId - Category ID
   * @returns Promise with the category or null if it doesn't exist
   */
  async getCategoryById(userId: string, categoryId: string): Promise<FirebaseCategory | null> {
    try {
      const categoryRef = this.db.doc(`users/${userId}/categories/${categoryId}`);
      const categoryDoc = await categoryRef.get();
      
      if (!categoryDoc.exists) {
        return null;
      }
      
      const data = categoryDoc.data() as Omit<FirebaseCategory, 'id'>;
      return {
        id: categoryDoc.id,
        name: String(data.name),
        apps: data.apps || [],
      };
    } catch (error) {
      console.error(`[Firebase] Error getting category ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Creates a new category
   * @param userId - User ID
   * @param category - Category data to create
   * @returns Promise with the created category including its ID
   */
  async createCategory(userId: string, category: Omit<FirebaseCategory, 'id'>): Promise<FirebaseCategory> {
    try {
      const categoriesRef = this.db.collection(`users/${userId}/categories`);
      const newCategoryRef = await categoriesRef.add({
        name: category.name,
        apps: category.apps || [],
      });
      
      return {
        id: newCategoryRef.id,
        name: String(category.name),
        apps: category.apps || [],
      };
    } catch (error) {
      console.error('[Firebase] Error creating category:', error);
      throw error;
    }
  }
  
  /**
   * Updates an existing category
   * @param userId - User ID
   * @param categoryId - Category ID
   * @param category - Updated category data
   * @returns Promise with the updated category
   */
  async updateCategory(userId: string, categoryId: string, category: Partial<FirebaseCategory>): Promise<FirebaseCategory> {
    try {
      const categoryRef = this.db.doc(`users/${userId}/categories/${categoryId}`);
      
      // Don't include the ID in the data to update
      const { id, ...updateData } = category;
      
      await categoryRef.update(updateData);
      
      const updatedCategory = await this.getCategoryById(userId, categoryId);
      if (!updatedCategory) {
        throw new Error(`Category ${categoryId} not found after update`);
      }
      
      return updatedCategory;
    } catch (error) {
      console.error(`[Firebase] Error updating category ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Deletes a category
   * @param userId - User ID
   * @param categoryId - Category ID
   * @returns Promise that resolves when the category is deleted
   */
  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    try {
      const categoryRef = this.db.doc(`users/${userId}/categories/${categoryId}`);
      await categoryRef.delete();
    } catch (error) {
      console.error(`[Firebase] Error deleting category ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Gets all applications for a specific category
   * @param userId - User ID
   * @param categoryId - Category ID
   * @returns Promise with array of applications
   */
  async getApps(userId: string, categoryId: string): Promise<FirebaseApp[]> {
    try {
      const category = await this.getCategoryById(userId, categoryId);
      if (!category) {
        return [];
      }
      
      return category.apps || [];
    } catch (error) {
      console.error(`[Firebase] Error getting applications from category ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Gets a specific application
   * @param userId - User ID
   * @param categoryId - Category ID
   * @param appId - Application ID
   * @returns Promise with the application or null if it doesn't exist
   */
  async getAppById(userId: string, categoryId: string, appId: string): Promise<FirebaseApp | null> {
    try {
      const apps = await this.getApps(userId, categoryId);
      return apps.find(app => app.id === appId) || null;
    } catch (error) {
      console.error(`[Firebase] Error getting application ${appId}:`, error);
      throw error;
    }
  }
  
  /**
   * Creates a new application in a category
   * @param userId - User ID
   * @param categoryId - Category ID
   * @param app - Application data to create
   * @returns Promise with the created application including its ID
   */
  async createApp(userId: string, categoryId: string, app: Omit<FirebaseApp, 'id'>): Promise<FirebaseApp> {
    try {
      const category = await this.getCategoryById(userId, categoryId);
      if (!category) {
        throw new Error(`Category ${categoryId} not found`);
      }
      
      const newApp: FirebaseApp = {
        id: crypto.randomUUID(),
        name: String(app.name),
        url: String(app.url),
        icon: String(app.icon),
        description: app.description,
      };
      
      const apps = [...(category.apps || []), newApp];
      
      await this.updateCategory(userId, categoryId, { apps });
      
      return newApp;
    } catch (error) {
      console.error(`[Firebase] Error creating application in category ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Updates an existing application
   * @param userId - User ID
   * @param categoryId - Category ID
   * @param appId - Application ID
   * @param app - Updated application data
   * @returns Promise with the updated application
   */
  async updateApp(userId: string, categoryId: string, appId: string, app: Partial<FirebaseApp>): Promise<FirebaseApp> {
    try {
      const category = await this.getCategoryById(userId, categoryId);
      if (!category) {
        throw new Error(`Category ${categoryId} not found`);
      }
      
      const apps = category.apps || [];
      const appIndex = apps.findIndex(a => a.id === appId);
      
      if (appIndex === -1) {
        throw new Error(`Application ${appId} not found in category ${categoryId}`);
      }
      
      const updatedApp = {
        ...apps[appIndex],
        ...app,
        id: appId, // Ensure original ID is preserved
      };
      
      apps[appIndex] = updatedApp;
      
      await this.updateCategory(userId, categoryId, { apps });
      
      return updatedApp;
    } catch (error) {
      console.error(`[Firebase] Error updating application ${appId}:`, error);
      throw error;
    }
  }
  
  /**
   * Deletes an application
   * @param userId - User ID
   * @param categoryId - Category ID
   * @param appId - Application ID
   * @returns Promise that resolves when the application is deleted
   */
  async deleteApp(userId: string, categoryId: string, appId: string): Promise<void> {
    try {
      const category = await this.getCategoryById(userId, categoryId);
      if (!category) {
        throw new Error(`Category ${categoryId} not found`);
      }
      
      const apps = (category.apps || []).filter(app => app.id !== appId);
      
      await this.updateCategory(userId, categoryId, { apps });
    } catch (error) {
      console.error(`[Firebase] Error deleting application ${appId}:`, error);
      throw error;
    }
  }
  
  /**
   * Toggles the favorite status of an application
   * @param userId - User ID
   * @param appId - Application ID
   * @param isFavorite - Indicates if the application should be marked as favorite
   * @returns Promise that resolves when the operation is completed
   */
  async toggleFavorite(userId: string, appId: string, isFavorite: boolean): Promise<void> {
    try {
      const favoriteRef = this.db.doc(`users/${userId}/favorites/${appId}`);
      
      if (isFavorite) {
        // First, find the application in all categories
        const categories = await this.getCategories(userId);
        let foundApp: FirebaseApp | null = null;
        
        for (const category of categories) {
          const app = (category.apps || []).find(app => app.id === appId);
          if (app) {
            foundApp = app;
            break;
          }
        }
        
        if (!foundApp) {
          throw new Error(`Application ${appId} not found`);
        }
        
        // Save as favorite
        await favoriteRef.set({
          ...foundApp,
          timestamp: FieldValue.serverTimestamp(),
        });
      } else {
        // Remove from favorites
        await favoriteRef.delete();
      }
    } catch (error) {
      console.error(`[Firebase] Error ${isFavorite ? 'adding' : 'removing'} favorite ${appId}:`, error);
      throw error;
    }
  }
  
  /**
   * Gets all favorite applications for a user
   * @param userId - User ID
   * @returns Promise with array of favorite applications
   */
  async getFavorites(userId: string): Promise<FirebaseApp[]> {
    try {
      const favoritesRef = this.db.collection(`users/${userId}/favorites`);
      const favoritesQuery = favoritesRef.orderBy('timestamp', 'desc');
      const snapshot = await favoritesQuery.get();
      
      const favorites: FirebaseApp[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        favorites.push({
          id: String(doc.id),
          name: String(data.name),
          url: String(data.url),
          icon: String(data.icon),
          description: data.description,
        });
      });
      
      return favorites;
    } catch (error) {
      console.error('[Firebase] Error getting favorites:', error);
      throw error;
    }
  }
  
  /**
   * Checks if an application is marked as favorite
   * @param userId - User ID
   * @param appId - Application ID
   * @returns Promise with a boolean indicating if it's a favorite
   */
  async isFavorite(userId: string, appId: string): Promise<boolean> {
    try {
      const favoriteRef = this.db.doc(`users/${userId}/favorites/${appId}`);
      const favoriteDoc = await favoriteRef.get();
      
      return favoriteDoc.exists;
    } catch (error) {
      console.error(`[Firebase] Error checking if ${appId} is a favorite:`, error);
      throw error;
    }
  }
  
  /**
   * Records an access to an application
   * @param userId - User ID
   * @param appId - Application ID
   * @returns Promise that resolves when the access is recorded
   */
  async recordAccess(userId: string, appId: string): Promise<void> {
    try {
      const historyRef = this.db.collection(`users/${userId}/history`);
      
      // First, find the application in all categories
      const categories = await this.getCategories(userId);
      let foundApp: FirebaseApp | null = null;
      
      for (const category of categories) {
        const app = (category.apps || []).find(app => app.id === appId);
        if (app) {
          foundApp = app;
          break;
        }
      }
      
      if (!foundApp) {
        throw new Error(`Application ${appId} not found`);
      }
      
      // Record access
      await historyRef.add({
        appId: appId,
        name: foundApp.name,
        url: foundApp.url,
        icon: foundApp.icon,
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error(`[Firebase] Error recording access to ${appId}:`, error);
      throw error;
    }
  }
  
  /**
   * Gets recently accessed applications
   * @param userId - User ID
   * @param limitCount - Maximum number of applications to return
   * @returns Promise with array of recent applications
   */
  async getRecentApps(userId: string, limitCount: number = 10): Promise<FirebaseApp[]> {
    try {
      const historyRef = this.db.collection(`users/${userId}/history`);
      const recentQuery = historyRef
        .orderBy('timestamp', 'desc')
        .limit(limitCount);
      
      const snapshot = await recentQuery.get();
      
      const recentApps: FirebaseApp[] = [];
      const addedIds = new Set<string>();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const appId = data.appId;
        
        // Avoid duplicates
        if (!addedIds.has(appId)) {
          addedIds.add(appId);
          recentApps.push({
            id: String(appId),
            name: String(data.name),
            url: String(data.url),
            icon: String(data.icon),
            description: data.description,
          });
        }
      });
      
      return recentApps;
    } catch (error) {
      console.error('[Firebase] Error getting recent applications:', error);
      throw error;
    }
  }
  
  /**
   * Searches for applications by search term
   * @param userId - User ID
   * @param searchTerm - Search term
   * @returns Promise with array of applications that match the search
   */
  async searchApps(userId: string, searchTerm: string): Promise<FirebaseApp[]> {
    try {
      const categories = await this.getCategories(userId);
      const searchTermLower = searchTerm.toLowerCase();
      
      const results: FirebaseApp[] = [];
      
      // Search in all categories and their applications
      for (const category of categories) {
        const matchingApps = (category.apps || []).filter(app => 
          app.name.toLowerCase().includes(searchTermLower) || 
          (app.description || '').toLowerCase().includes(searchTermLower)
        );
        
        results.push(...matchingApps);
      }
      
      return results;
    } catch (error) {
      console.error(`[Firebase] Error searching applications with term "${searchTerm}":`, error);
      throw error;
    }
  }
  
  /**
   * Gets the global application configuration
   * @returns Promise with the application configuration
   */
  async getAppConfig(): Promise<Record<string, any>> {
    try {
      const configRef = this.db.doc('config/appConfig');
      const configDoc = await configRef.get();
      
      if (!configDoc.exists) {
        // If it doesn't exist, create with default values
        const defaultConfig = {
          showRegisterTab: true,
        };
        
        await configRef.set(defaultConfig);
        return defaultConfig;
      }
      
      return configDoc.data() as Record<string, any>;
    } catch (error) {
      console.error('[Firebase] Error getting application configuration:', error);
      throw error;
    }
  }
  
  /**
   * Updates the global application configuration
   * @param config - Partial configuration to update
   * @returns Promise with the updated configuration
   */
  async updateAppConfig(config: Record<string, any>): Promise<Record<string, any>> {
    try {
      // Get current configuration
      const currentConfig = await this.getAppConfig();
      
      // Merge with the new configuration
      const newConfig = {
        ...currentConfig,
        ...config,
      };
      
      // Update
      const configRef = this.db.doc('config/appConfig');
      await configRef.set(newConfig);
      
      return newConfig;
    } catch (error) {
      console.error('[Firebase] Error updating application configuration:', error);
      throw error;
    }
  }

  /**
   * Gets all registered users in the system
   * @returns Promise with array of users
   */
  async getUsers(): Promise<FirebaseUser[]> {
    try {
      console.log('[Firebase] Getting user list with Firebase Auth');
      
      // Use Firebase Auth to get the list of users
      const { auth } = getFirebaseInstances();
      
      try {
        // Get users (maximum 1000, pagination could be implemented if needed)
        const listUsersResult = await auth.listUsers(1000);
        
        if (!listUsersResult.users || listUsersResult.users.length === 0) {
          console.log('[Firebase] No users found in Firebase Auth');
          return [];
        }
        
        // Convert Firebase Auth users to the format expected by our application
        const users: FirebaseUser[] = listUsersResult.users.map(user => {
          return {
            id: user.uid,
            username: user.displayName || user.email?.split('@')[0] || '',
            email: user.email || '',
            role: (user.customClaims?.role === UserRole.ADMIN) ? UserRole.ADMIN : UserRole.USER,
            createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
            disabled: user.disabled || false,
          };
        });
        
        console.log(`[Firebase] Found ${users.length} users in Firebase Auth`);
        return users;
      } catch (authError) {
        console.error('[Firebase] Error getting users with Firebase Auth:', authError);
        
        // If fetching with Auth fails, try with the previous method
        console.log('[Firebase] Trying to get current user as an alternative');
        const authId = this.getCurrentUserId();
        if (!authId) {
          console.error('[Firebase] No authenticated user to get user list');
          return [];
        }
        
        const currentUser = await this.getUserById(authId);
        
        if (currentUser) {
          console.log('[Firebase] Returning at least the current user', currentUser);
          return [currentUser];
        }
      }
      
      return [];
    } catch (error) {
      console.error('[Firebase] Error getting users:', error);
      return []; // Return an empty array in case of error to prevent the application from breaking
    }
  }
  
  // Helper method to get the currently authenticated user ID
  private getCurrentUserId(): string | null {
    try {
      // On the server, we use the default admin user ID
      // This ID is used to access system data like the user list
      return 'u20InPS27iMb50V9kzjKScKSx4j1'; // Default admin user ID
    } catch (error) {
      console.error('[Firebase] Error getting the current user ID:', error);
      return null;
    }
  }
  
  /**
   * Gets a specific user by their ID
   * @param userId - User ID
   * @returns Promise with the user or null if they don't exist
   */
  async getUserById(userId: string): Promise<FirebaseUser | null> {
    try {
      const userRef = this.db.doc(`users/${userId}`);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        // If the document doesn't exist but it's the default admin ID,
        // create a default admin user
        if (userId === 'u20InPS27iMb50V9kzjKScKSx4j1') {
          console.log('[Firebase] Creating default administrator user');
          
          // Create a default admin user
          const defaultAdmin: FirebaseUser = {
            id: userId,
            username: 'Administrator',
            email: 'admin@bookmarkmanager.com',
            role: UserRole.ADMIN,
            createdAt: new Date(),
            disabled: false,
          };
          
          // Save the user in Firestore for future queries
          await userRef.set({
            username: defaultAdmin.username,
            email: defaultAdmin.email,
            role: defaultAdmin.role,
            createdAt: defaultAdmin.createdAt,
            disabled: defaultAdmin.disabled,
          });
          
          return defaultAdmin;
        }
        
        return null;
      }
      
      const data = userDoc.data() || {};
      return {
        id: userDoc.id,
        username: data.username || '',
        email: data.email || '',
        role: data.role || UserRole.USER,
        createdAt: data.createdAt || new Date(),
        disabled: data.disabled || false,
      };
    } catch (error) {
      console.error(`[Firebase] Error getting user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Updates a user's role
   * @param userId - User ID
   * @param role - New role for the user
   * @returns Promise with the updated user
   */
  async updateUserRole(userId: string, role: UserRole): Promise<FirebaseUser> {
    try {
      console.log(`[Firebase] Updating user role ${userId} to ${role}`);
      
      // Use Firebase Auth to update the user's role
      const { auth } = getFirebaseInstances();
      
      // Custom claims are used to store roles and other custom data
      await auth.setCustomUserClaims(userId, { role });
      
      // Also update the document in Firestore to maintain consistency
      try {
        const userRef = this.db.doc(`users/${userId}`);
        await userRef.update({
          role: role
        });
      } catch (error) {
        const firestoreError = error as Error;
        console.warn(`[Firebase] Error updating role in Firestore: ${firestoreError.message}`);
        // We don't fail completely if only Firestore fails but Auth worked
      }
      
      // Get the updated user
      // Note: There may be a slight delay before custom claims are available
      const user = await auth.getUser(userId);
      
      return {
        id: user.uid,
        username: user.displayName || user.email?.split('@')[0] || '',
        email: user.email || '',
        role: role, // Use the role we just assigned
        createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
        disabled: user.disabled || false,
      };
    } catch (error) {
      console.error(`[Firebase] Error updating user role ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Activates or deactivates a user
   * @param userId - User ID
   * @param disabled - Indicates if the user should be disabled
   * @returns Promise with the updated user
   */
  async toggleUserStatus(userId: string, disabled: boolean): Promise<FirebaseUser> {
    try {
      console.log(`[Firebase] ${disabled ? 'Disabling' : 'Enabling'} user ${userId}`);
      
      // Use Firebase Auth to disable/enable the user
      const { auth } = getFirebaseInstances();
      
      await auth.updateUser(userId, {
        disabled: disabled
      });
      
      // Also update the document in Firestore to maintain consistency
      try {
        const userRef = this.db.doc(`users/${userId}`);
        await userRef.update({
          disabled: disabled
        });
      } catch (error) {
        const firestoreError = error as Error;
        console.warn(`[Firebase] Error updating status in Firestore: ${firestoreError.message}`);
        // We don't fail completely if only Firestore fails but Auth worked
      }
      
      // Get the updated user
      const user = await auth.getUser(userId);
      
      return {
        id: user.uid,
        username: user.displayName || user.email?.split('@')[0] || '',
        email: user.email || '',
        role: user.customClaims?.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.USER,
        createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
        disabled: user.disabled || false,
      };
    } catch (error) {
      console.error(`[Firebase] Error ${disabled ? 'disabling' : 'enabling'} user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Deletes a user
   * @param userId - User ID
   * @returns Promise that resolves when the user is deleted
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log(`[Firebase] Deleting user ${userId}`);
      
      // Use Firebase Auth to delete the user
      const { auth } = getFirebaseInstances();
      
      await auth.deleteUser(userId);
      
      // Also delete the document in Firestore to maintain consistency
      try {
        const userRef = this.db.doc(`users/${userId}`);
        await userRef.delete();
      } catch (error) {
        const firestoreError = error as Error;
        console.warn(`[Firebase] Error deleting user in Firestore: ${firestoreError.message}`);
        // We don't fail completely if only Firestore fails but Auth worked
      }
    } catch (error) {
      console.error(`[Firebase] Error deleting user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Checks if there are users in the system
   * @returns Promise with a boolean indicating if there are users
   */
  async hasUsers(): Promise<boolean> {
    try {
      console.log('[Firebase] Checking if there are users with Firebase Auth');
      
      // Use Firebase Auth to check if there are users
      const { auth } = getFirebaseInstances();
      
      try {
        // Try to get just one user
        const listUsersResult = await auth.listUsers(1);
        return listUsersResult.users.length > 0;
      } catch (authError) {
        console.error('[Firebase] Error checking users with Firebase Auth:', authError);
        
        // If fetching with Auth fails, try with Firestore
        console.log('[Firebase] Trying to check users with Firestore');
        const usersRef = this.db.collection('users');
        const snapshot = await usersRef.limit(1).get();
        
        return !snapshot.empty;
      }
    } catch (error) {
      console.error('[Firebase] Error checking existence of users:', error);
      throw error;
    }
  }
}