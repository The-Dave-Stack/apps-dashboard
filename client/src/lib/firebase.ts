/**
 * @fileoverview Firebase Firestore operations for Bookmark Manager Sync
 * This module provides functions to interact with Firestore,
 * allowing CRUD operations for categories and applications.
 * Supports multi-user architecture where each user has their own data.
 * @module lib/firebase
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  limit as limitQuery,
  Firestore,
  CollectionReference,
  DocumentData
} from "firebase/firestore";
import type { CategoryData, AppData } from "@/lib/types";
import { getFirebaseInstances } from "./firebase-init";

/**
 * Firebase instances obtained through controlled initialization
 * Uses the Singleton pattern to avoid multiple initializations
 */
const { app, auth, db } = getFirebaseInstances();

/**
 * Gets the reference to the categories collection for the current user.
 * If there is no authenticated user, returns null.
 * 
 * @returns {CollectionReference<DocumentData> | null} Reference to the user's categories collection or null
 */
export function getUserCategoriesRef(): CollectionReference<DocumentData> | null {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("[Firebase] No authenticated user to get references");
    return null;
  }
  
  return collection(db, `users/${currentUser.uid}/categories`);
}

/**
 * Gets the reference to the apps collection for the current user.
 * If there is no authenticated user, returns null.
 * 
 * @returns {CollectionReference<DocumentData> | null} Reference to the user's apps collection or null
 */
export function getUserAppsRef(): CollectionReference<DocumentData> | null {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("[Firebase] No authenticated user to get references");
    return null;
  }
  
  return collection(db, `users/${currentUser.uid}/apps`);
}

/**
 * Gets all categories stored in Firestore for the current user,
 * including their associated applications.
 * Performs two queries: one for categories and another for applications of each category.
 * 
 * @async
 * @returns {Promise<CategoryData[]>} A promise that resolves to an array of categories with their applications
 * @throws {Error} If an error occurs during the Firestore query or if there is no authenticated user
 * @example
 * // Get all categories with their applications
 * const categories = await fetchCategories();
 * console.log(`Found ${categories.length} categories`);
 */
export async function fetchCategories(): Promise<CategoryData[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No authenticated user to get categories");
      return [];
    }
    
    const userCategoriesRef = getUserCategoriesRef();
    const userAppsRef = getUserAppsRef();
    
    if (!userCategoriesRef || !userAppsRef) {
      console.error("[Firebase] Could not get references to collections");
      return [];
    }
    
    console.log(`[Firebase] Getting categories for user: ${currentUser.uid}`);
    const categoriesSnapshot = await getDocs(userCategoriesRef);
    const categories: CategoryData[] = [];
    
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryData = categoryDoc.data() as Record<string, any>;
      
      // Get the applications for this category
      const appQuery = query(userAppsRef, where("categoryId", "==", categoryDoc.id));
      const appSnapshot = await getDocs(appQuery);
      
      const apps: AppData[] = appSnapshot.docs.map(appDoc => {
        const appData = appDoc.data() as Record<string, any>;
        return {
          id: appDoc.id,
          name: appData.name,
          icon: appData.icon,
          url: appData.url,
          description: appData.description || ''
        };
      });
      
      categories.push({
        id: categoryDoc.id,
        name: categoryData.name,
        apps
      });
    }
    
    console.log(`[Firebase] Found ${categories.length} categories for user ${currentUser.uid}`);
    return categories;
  } catch (error) {
    console.error("[Firebase] Error getting categories:", error);
    return [];
  }
}

/**
 * Saves a category to Firestore for the current user,
 * either creating a new one or updating an existing one.
 * Includes robust error handling and automatic retries for greater fault tolerance.
 * 
 * @async
 * @param {CategoryData} category - Category data to save
 * @returns {Promise<CategoryData>} The saved category with its assigned ID
 * @throws {Error} If the category cannot be saved to Firebase or there is no authenticated user
 * @example
 * // Create a new category
 * const newCategory = await saveCategory({name: "New Category", apps: []});
 * 
 * // Update an existing category
 * await saveCategory({id: "abc123", name: "Updated Category", apps: []});
 */
export async function saveCategory(category: CategoryData): Promise<CategoryData> {
  try {
    // Debug log
    console.log("[Firebase] Attempting to save category:", category);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No authenticated user to save categories");
      throw new Error("User not authenticated");
    }
    
    if (!db) {
      console.error("[Firebase] Error: Firestore has not been properly initialized");
      throw new Error("Firestore not initialized");
    }
    
    // Verify connection to Firestore with a simple operation
    try {
      console.log("[Firebase] Verifying connection to Firestore...");
      const testRef = collection(db, "test_connection");
      await getDocs(testRef);
      console.log("[Firebase] Connection to Firestore verified");
    } catch (connectionError) {
      console.error("[Firebase] Firestore connection issue:", connectionError);
      // Continue anyway, collection might not exist
    }
    
    const userCategoriesPath = `users/${currentUser.uid}/categories`;
    
    if (category.id && category.id.trim() !== "") {
      // Update existing category
      console.log(`[Firebase] Updating category with ID: ${category.id} for user: ${currentUser.uid}`);
      try {
        const categoryRef = doc(db, userCategoriesPath, category.id);
        await updateDoc(categoryRef, { name: category.name });
        console.log("[Firebase] Category successfully updated");
        return category;
      } catch (updateError) {
        console.error("[Firebase] Error updating category:", updateError);
        
        // If update fails, try creating a new one
        console.log("[Firebase] Attempting to create instead...");
        try {
          // Try to create with alternative method
          const categoriesCollection = collection(db, userCategoriesPath);
          const newCategoryRef = doc(categoriesCollection);
          const newCategory = { name: category.name };
          
          await setDoc(newCategoryRef, newCategory);
          
          console.log("[Firebase] Category successfully created, ID:", newCategoryRef.id);
          return {
            ...category,
            id: newCategoryRef.id,
            apps: []
          };
        } catch (createError) {
          console.error("[Firebase] Error also when creating:", createError);
          throw createError;
        }
      }
    } else {
      // Create new category
      console.log(`[Firebase] Creating new category: ${category.name} for user: ${currentUser.uid}`);
      
      try {
        // Verify if we can access the collection
        const categoriesCollection = collection(db, userCategoriesPath);
        console.log("[Firebase] Categories collection accessible");
        
        // Create a new document with automatic ID
        const newCategoryRef = doc(categoriesCollection);
        console.log("[Firebase] Reference created:", newCategoryRef.id);
        
        const newCategory = { name: category.name };
        
        console.log("[Firebase] Attempting to save document...");
        await setDoc(newCategoryRef, newCategory);
        
        console.log("[Firebase] Category successfully created, ID:", newCategoryRef.id);
        return {
          ...category,
          id: newCategoryRef.id,
          apps: []
        };
      } catch (createError) {
        console.error("[Firebase] Detailed error creating category:", createError);
        if (createError instanceof Error) {
          console.error("[Firebase] Code:", createError.name);
          console.error("[Firebase] Message:", createError.message);
          console.error("[Firebase] Stack:", createError.stack);
        }
        throw createError;
      }
    }
  } catch (error) {
    console.error("[Firebase] Critical error saving category:", error);
    // More detailed log to detect the problem
    if (error instanceof Error) {
      console.error("[Firebase] Error message:", error.message);
      console.error("[Firebase] Error stack:", error.stack);
    }
    
    // For diagnosis, we try a very basic operation
    try {
      const simpleData = { test: true, timestamp: new Date().toISOString() };
      const testDoc = doc(collection(db, "debug_test"));
      await setDoc(testDoc, simpleData);
      console.log("[Firebase] Diagnostic test successful, could create test document");
    } catch (testError) {
      console.error("[Firebase] Even the diagnostic test failed:", testError);
    }
    
    // Provide a friendly error message for the user
    throw new Error("Could not save the category to Firebase. Please try again later.");
  }
}

/**
 * Deletes a category and all its associated applications from Firestore for the current user.
 * First removes all applications that belong to the category and then deletes the category.
 * 
 * @async
 * @param {string} categoryId - ID of the category to delete
 * @returns {Promise<void>} Promise that resolves when the deletion is complete
 * @throws {Error} If the category cannot be deleted from Firebase or there is no authenticated user
 * @example
 * // Delete a category and all its applications
 * await deleteCategory("abc123");
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    console.log("[Firebase] Attempting to delete category with ID:", categoryId);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No authenticated user to delete categories");
      throw new Error("User not authenticated");
    }
    
    if (!db) {
      console.error("[Firebase] Error: Firestore has not been properly initialized");
      throw new Error("Firestore not initialized");
    }
    
    const userAppsRef = getUserAppsRef();
    const userCategoriesRef = getUserCategoriesRef();
    
    if (!userAppsRef || !userCategoriesRef) {
      console.error("[Firebase] Could not get references to collections");
      throw new Error("Error getting references to collections");
    }
    
    // First delete all applications associated with this category
    console.log("[Firebase] Finding applications associated with the category");
    const appQuery = query(userAppsRef, where("categoryId", "==", categoryId));
    const appSnapshot = await getDocs(appQuery);
    
    const appsToDelete = appSnapshot.docs.length;
    console.log(`[Firebase] Found ${appsToDelete} applications to delete`);
    
    if (appsToDelete > 0) {
      const deletePromises = appSnapshot.docs.map(appDoc => {
        console.log(`[Firebase] Deleting application: ${appDoc.id}`);
        return deleteDoc(doc(db, `users/${currentUser.uid}/apps`, appDoc.id));
      });
      
      await Promise.all(deletePromises);
      console.log("[Firebase] All applications in the category were deleted");
    }
    
    // Now delete the category
    console.log("[Firebase] Deleting the category");
    await deleteDoc(doc(db, `users/${currentUser.uid}/categories`, categoryId));
    console.log("[Firebase] Category successfully deleted");
  } catch (error) {
    console.error("[Firebase] Error deleting category:", error);
    if (error instanceof Error) {
      console.error("[Firebase] Error message:", error.message);
      console.error("[Firebase] Error stack:", error.stack);
    }
    throw new Error("Could not delete the category from Firebase. Please try again later.");
  }
}

/**
 * Functions for application management
 */

/**
 * Saves an application to Firestore for the current user,
 * either creating a new one or updating an existing one.
 * Handles errors robustly and performs automatic retry in case of failure.
 * 
 * @async
 * @param {AppData} app - Application data to save
 * @param {string} categoryId - ID of the category to which the application belongs
 * @returns {Promise<AppData>} The saved application with its assigned ID
 * @throws {Error} If the application cannot be saved to Firebase or there is no authenticated user
 * @example
 * // Create a new application
 * const newApp = await saveApp({
 *   name: "New App",
 *   icon: "https://example.com/icon.png",
 *   url: "https://example.com",
 *   description: "App description"
 * }, "category123");
 */
export async function saveApp(app: AppData, categoryId: string): Promise<AppData> {
  try {
    console.log("[Firebase] Attempting to save application:", app, "in category:", categoryId);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No authenticated user to save applications");
      throw new Error("User not authenticated");
    }
    
    if (!db) {
      console.error("[Firebase] Error: Firestore has not been properly initialized");
      throw new Error("Firestore not initialized");
    }
    
    const userAppsPath = `users/${currentUser.uid}/apps`;
    
    if (app.id) {
      // Update existing app
      console.log(`[Firebase] Updating application with ID: ${app.id} for user: ${currentUser.uid}`);
      try {
        const appRef = doc(db, userAppsPath, app.id);
        await updateDoc(appRef, { 
          name: app.name,
          icon: app.icon,
          url: app.url,
          description: app.description || '',
          categoryId
        });
        console.log("[Firebase] Application successfully updated");
        return app;
      } catch (updateError) {
        console.error("[Firebase] Error updating application:", updateError);
        
        // If update fails, try creating a new one
        console.log("[Firebase] Attempting to create application instead...");
        const appsCollection = collection(db, userAppsPath);
        const newAppRef = doc(appsCollection);
        const newApp = {
          name: app.name,
          icon: app.icon,
          url: app.url,
          description: app.description || '',
          categoryId
        };
        
        await setDoc(newAppRef, newApp);
        console.log("[Firebase] Application successfully created, ID:", newAppRef.id);
        return {
          ...app,
          id: newAppRef.id
        };
      }
    } else {
      // Create new app
      console.log(`[Firebase] Creating new application: ${app.name} for user: ${currentUser.uid}`);
      const appsCollection = collection(db, userAppsPath);
      const newAppRef = doc(appsCollection);
      const newApp = {
        name: app.name,
        icon: app.icon,
        url: app.url,
        description: app.description || '',
        categoryId
      };
      
      console.log("[Firebase] Reference created, attempting to save application");
      await setDoc(newAppRef, newApp);
      console.log("[Firebase] Application successfully created, ID:", newAppRef.id);
      
      return {
        ...app,
        id: newAppRef.id
      };
    }
  } catch (error) {
    console.error("[Firebase] Critical error saving application:", error);
    if (error instanceof Error) {
      console.error("[Firebase] Error message:", error.message);
      console.error("[Firebase] Error stack:", error.stack);
    }
    throw new Error("Could not save the application to Firebase. Please try again later.");
  }
}

/**
 * Deletes an application from Firestore by its ID for the current user.
 * 
 * @async
 * @param {string} appId - ID of the application to delete
 * @returns {Promise<void>} Promise that resolves when the deletion is complete
 * @throws {Error} If the application cannot be deleted from Firebase or there is no authenticated user
 * @example
 * // Delete a specific application
 * await deleteApp("app123");
 */
export async function deleteApp(appId: string): Promise<void> {
  try {
    console.log("[Firebase] Attempting to delete application with ID:", appId);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No authenticated user to delete applications");
      throw new Error("User not authenticated");
    }
    
    if (!db) {
      console.error("[Firebase] Error: Firestore has not been properly initialized");
      throw new Error("Firestore not initialized");
    }
    
    const userAppsPath = `users/${currentUser.uid}/apps`;
    await deleteDoc(doc(db, userAppsPath, appId));
    console.log(`[Firebase] Application successfully deleted for user: ${currentUser.uid}`);
  } catch (error) {
    console.error("[Firebase] Error deleting application:", error);
    if (error instanceof Error) {
      console.error("[Firebase] Error message:", error.message);
      console.error("[Firebase] Error stack:", error.stack);
    }
    throw new Error("Could not delete the application from Firebase. Please try again later.");
  }
}

/**
 * Functions for user favorites management
 */

/**
 * Gets the reference to the favorites collection for the current user.
 * If there is no authenticated user, returns null.
 * 
 * @returns {CollectionReference<DocumentData> | null} Reference to the user's favorites collection or null
 */
export function getUserFavoritesRef(): CollectionReference<DocumentData> | null {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("[Firebase] No authenticated user to get favorite references");
    return null;
  }
  
  return collection(db, `users/${currentUser.uid}/favorites`);
}

/**
 * Adds an application to the user's favorites.
 * 
 * @async
 * @param {AppData} app - Data of the application to mark as favorite
 * @returns {Promise<void>} Promise that resolves when the operation is complete
 * @throws {Error} If it cannot be added to favorites or there is no authenticated user
 */
export async function addToFavorites(app: AppData): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No authenticated user to add favorites");
      throw new Error("User not authenticated");
    }
    
    const favoritesRef = getUserFavoritesRef();
    if (!favoritesRef) {
      throw new Error("Could not get reference to favorites");
    }

    // Use the app ID as the favorite document ID
    const favoriteId = app.id;
    if (!favoriteId) {
      throw new Error("The application has no valid ID");
    }
    
    await setDoc(doc(favoritesRef, favoriteId), {
      appId: favoriteId,
      name: app.name,
      icon: app.icon,
      url: app.url,
      description: app.description || '',
      addedAt: new Date().toISOString()
    });
    
    console.log(`[Firebase] App added to favorites: ${app.name} for user: ${currentUser.uid}`);
  } catch (error) {
    console.error("[Firebase] Error adding to favorites:", error);
    if (error instanceof Error) {
      console.error("[Firebase] Error message:", error.message);
    }
    throw new Error("Could not add the application to favorites. Please try again later.");
  }
}

/**
 * Removes an application from the user's favorites.
 * 
 * @async
 * @param {string} appId - ID of the application to remove from favorites
 * @returns {Promise<void>} Promise that resolves when the operation is complete
 * @throws {Error} If it cannot be removed from favorites or there is no authenticated user
 */
export async function removeFromFavorites(appId: string): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No authenticated user to remove favorites");
      throw new Error("User not authenticated");
    }
    
    await deleteDoc(doc(db, `users/${currentUser.uid}/favorites`, appId));
    console.log(`[Firebase] App removed from favorites: ${appId} for user: ${currentUser.uid}`);
  } catch (error) {
    console.error("[Firebase] Error removing from favorites:", error);
    if (error instanceof Error) {
      console.error("[Firebase] Error message:", error.message);
    }
    throw new Error("Could not remove the application from favorites. Please try again later.");
  }
}

/**
 * Checks if an application is in the user's favorites.
 * 
 * @async
 * @param {string} appId - ID of the application to check
 * @returns {Promise<boolean>} True if the app is in favorites, false otherwise
 */
export async function isAppFavorite(appId: string): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return false;
    }
    
    const favoriteRef = doc(db, `users/${currentUser.uid}/favorites`, appId);
    const favoriteDoc = await getDoc(favoriteRef);
    
    return favoriteDoc.exists();
  } catch (error) {
    console.error("[Firebase] Error checking favorite:", error);
    return false;
  }
}

/**
 * Gets all favorite applications for the current user.
 * 
 * @async
 * @returns {Promise<AppData[]>} List of favorite applications
 */
export async function getFavoriteApps(): Promise<AppData[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No authenticated user to get favorites");
      return [];
    }
    
    const favoritesRef = getUserFavoritesRef();
    if (!favoritesRef) {
      return [];
    }
    
    const snapshot = await getDocs(favoritesRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        name: data.name,
        icon: data.icon,
        url: data.url,
        description: data.description || ''
      };
    });
  } catch (error) {
    console.error("[Firebase] Error getting favorites:", error);
    return [];
  }
}

/**
 * Functions for application access history tracking
 */

/**
 * Gets the reference to the access history collection for the current user.
 * If there is no authenticated user, returns null.
 * 
 * @returns {CollectionReference<DocumentData> | null} Reference to the user's history collection or null
 */
export function getUserHistoryRef(): CollectionReference<DocumentData> | null {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("[Firebase] No authenticated user to get history references");
    return null;
  }
  
  return collection(db, `users/${currentUser.uid}/history`);
}

/**
 * Records an access to an application in the user's history.
 * 
 * @async
 * @param {AppData} app - Data of the application that was accessed
 * @returns {Promise<void>} Promise that resolves when the operation is complete
 */
export async function recordAppAccess(app: AppData): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      // If there is no authenticated user, we don't record anything but don't throw an error
      return;
    }
    
    const historyRef = getUserHistoryRef();
    if (!historyRef) {
      return;
    }
    
    // Use a unique ID for each access
    const accessId = doc(historyRef).id;
    
    await setDoc(doc(historyRef, accessId), {
      appId: app.id,
      name: app.name,
      icon: app.icon,
      url: app.url,
      accessedAt: new Date().toISOString()
    });
    
    console.log(`[Firebase] Access recorded to: ${app.name} for user: ${currentUser.uid}`);
  } catch (error) {
    console.error("[Firebase] Error recording access:", error);
    // We don't throw an error to avoid interrupting the user experience
  }
}

/**
 * Gets the history of application accesses for the current user.
 * Results are ordered from most recent to oldest.
 * 
 * @async
 * @param {number} limitCount - Maximum number of records to obtain (default 10)
 * @returns {Promise<{appId: string, name: string, icon: string, url: string, accessedAt: string}[]>} List of recent accesses
 */
export async function getRecentAppAccess(limitCount = 10): Promise<{appId: string, name: string, icon: string, url: string, accessedAt: string}[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No authenticated user to get history");
      return [];
    }
    
    const historyRef = getUserHistoryRef();
    if (!historyRef) {
      return [];
    }
    
    // Sort by access date descending and limit to the specified amount
    const maxItems = limitCount > 0 ? limitCount : 10;
    // We use limitQuery (alias for the limit function from firebase/firestore)
    const q = query(historyRef, /* orderBy('accessedAt', 'desc'), */ limitQuery(maxItems));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data() as Record<string, any>;
      return {
        appId: data.appId,
        name: data.name,
        icon: data.icon,
        url: data.url,
        accessedAt: data.accessedAt
      };
    }).sort((a, b) => {
      // We sort manually since orderBy may not work in some environments
      return new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime();
    });
  } catch (error) {
    console.error("[Firebase] Error getting history:", error);
    return [];
  }
}

export { app, auth, db };
