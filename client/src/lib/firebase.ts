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
 * Guarda una aplicación en Firestore para el usuario actual, 
 * ya sea creando una nueva o actualizando una existente.
 * Gestiona errores de forma robusta y realiza reintento automático en caso de fallo.
 * 
 * @async
 * @param {AppData} app - Datos de la aplicación a guardar
 * @param {string} categoryId - ID de la categoría a la que pertenece la aplicación
 * @returns {Promise<AppData>} La aplicación guardada con su ID asignado
 * @throws {Error} Si no se puede guardar la aplicación en Firebase o no hay usuario autenticado
 * @example
 * // Crear una nueva aplicación
 * const newApp = await saveApp({
 *   name: "Nueva App",
 *   icon: "https://example.com/icon.png",
 *   url: "https://example.com",
 *   description: "Descripción de la app"
 * }, "categoria123");
 */
export async function saveApp(app: AppData, categoryId: string): Promise<AppData> {
  try {
    console.log("[Firebase] Intento de guardar aplicación:", app, "en categoría:", categoryId);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No hay usuario autenticado para guardar aplicaciones");
      throw new Error("Usuario no autenticado");
    }
    
    if (!db) {
      console.error("[Firebase] Error: No se ha inicializado Firestore correctamente");
      throw new Error("Firestore no inicializado");
    }
    
    const userAppsPath = `users/${currentUser.uid}/apps`;
    
    if (app.id) {
      // Actualizar app existente
      console.log(`[Firebase] Actualizando aplicación con ID: ${app.id} para usuario: ${currentUser.uid}`);
      try {
        const appRef = doc(db, userAppsPath, app.id);
        await updateDoc(appRef, { 
          name: app.name,
          icon: app.icon,
          url: app.url,
          description: app.description || '',
          categoryId
        });
        console.log("[Firebase] Aplicación actualizada con éxito");
        return app;
      } catch (updateError) {
        console.error("[Firebase] Error al actualizar la aplicación:", updateError);
        
        // Si falla la actualización, intentamos crear una nueva
        console.log("[Firebase] Intentando crear aplicación en su lugar...");
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
        console.log("[Firebase] Aplicación creada con éxito, ID:", newAppRef.id);
        return {
          ...app,
          id: newAppRef.id
        };
      }
    } else {
      // Crear nueva app
      console.log(`[Firebase] Creando nueva aplicación: ${app.name} para usuario: ${currentUser.uid}`);
      const appsCollection = collection(db, userAppsPath);
      const newAppRef = doc(appsCollection);
      const newApp = {
        name: app.name,
        icon: app.icon,
        url: app.url,
        description: app.description || '',
        categoryId
      };
      
      console.log("[Firebase] Referencia creada, intentando guardar aplicación");
      await setDoc(newAppRef, newApp);
      console.log("[Firebase] Aplicación creada con éxito, ID:", newAppRef.id);
      
      return {
        ...app,
        id: newAppRef.id
      };
    }
  } catch (error) {
    console.error("[Firebase] Error crítico al guardar aplicación:", error);
    if (error instanceof Error) {
      console.error("[Firebase] Mensaje de error:", error.message);
      console.error("[Firebase] Stack de error:", error.stack);
    }
    throw new Error("No se pudo guardar la aplicación en Firebase. Por favor, intente de nuevo más tarde.");
  }
}

/**
 * Elimina una aplicación de Firestore por su ID para el usuario actual.
 * 
 * @async
 * @param {string} appId - ID de la aplicación a eliminar
 * @returns {Promise<void>} Promesa que se resuelve cuando se completa la eliminación
 * @throws {Error} Si no se puede eliminar la aplicación de Firebase o no hay usuario autenticado
 * @example
 * // Eliminar una aplicación específica
 * await deleteApp("app123");
 */
export async function deleteApp(appId: string): Promise<void> {
  try {
    console.log("[Firebase] Intento de eliminar aplicación con ID:", appId);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No hay usuario autenticado para eliminar aplicaciones");
      throw new Error("Usuario no autenticado");
    }
    
    if (!db) {
      console.error("[Firebase] Error: No se ha inicializado Firestore correctamente");
      throw new Error("Firestore no inicializado");
    }
    
    const userAppsPath = `users/${currentUser.uid}/apps`;
    await deleteDoc(doc(db, userAppsPath, appId));
    console.log(`[Firebase] Aplicación eliminada con éxito para usuario: ${currentUser.uid}`);
  } catch (error) {
    console.error("[Firebase] Error al eliminar aplicación:", error);
    if (error instanceof Error) {
      console.error("[Firebase] Mensaje de error:", error.message);
      console.error("[Firebase] Stack de error:", error.stack);
    }
    throw new Error("No se pudo eliminar la aplicación de Firebase. Por favor, intente de nuevo más tarde.");
  }
}

/**
 * Funciones para la gestión de favoritos del usuario
 */

/**
 * Obtiene la referencia a la colección de favoritos para el usuario actual.
 * Si no hay usuario autenticado, devuelve null.
 * 
 * @returns {CollectionReference<DocumentData> | null} Referencia a la colección de favoritos del usuario o null
 */
export function getUserFavoritesRef(): CollectionReference<DocumentData> | null {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("[Firebase] No hay usuario autenticado para obtener referencias de favoritos");
    return null;
  }
  
  return collection(db, `users/${currentUser.uid}/favorites`);
}

/**
 * Agrega una aplicación a los favoritos del usuario.
 * 
 * @async
 * @param {AppData} app - Datos de la aplicación a marcar como favorita
 * @returns {Promise<void>} Promesa que se resuelve cuando se completa la operación
 * @throws {Error} Si no se puede agregar a favoritos o no hay usuario autenticado
 */
export async function addToFavorites(app: AppData): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No hay usuario autenticado para agregar favoritos");
      throw new Error("Usuario no autenticado");
    }
    
    const favoritesRef = getUserFavoritesRef();
    if (!favoritesRef) {
      throw new Error("No se pudo obtener la referencia a favoritos");
    }

    // Usamos el ID de la app como ID del documento favorito
    const favoriteId = app.id;
    if (!favoriteId) {
      throw new Error("La aplicación no tiene ID válido");
    }
    
    await setDoc(doc(favoritesRef, favoriteId), {
      appId: favoriteId,
      name: app.name,
      icon: app.icon,
      url: app.url,
      description: app.description || '',
      addedAt: new Date().toISOString()
    });
    
    console.log(`[Firebase] App agregada a favoritos: ${app.name} para usuario: ${currentUser.uid}`);
  } catch (error) {
    console.error("[Firebase] Error al agregar a favoritos:", error);
    if (error instanceof Error) {
      console.error("[Firebase] Mensaje de error:", error.message);
    }
    throw new Error("No se pudo agregar la aplicación a favoritos. Por favor, intente de nuevo más tarde.");
  }
}

/**
 * Elimina una aplicación de los favoritos del usuario.
 * 
 * @async
 * @param {string} appId - ID de la aplicación a quitar de favoritos
 * @returns {Promise<void>} Promesa que se resuelve cuando se completa la operación
 * @throws {Error} Si no se puede eliminar de favoritos o no hay usuario autenticado
 */
export async function removeFromFavorites(appId: string): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No hay usuario autenticado para eliminar favoritos");
      throw new Error("Usuario no autenticado");
    }
    
    await deleteDoc(doc(db, `users/${currentUser.uid}/favorites`, appId));
    console.log(`[Firebase] App eliminada de favoritos: ${appId} para usuario: ${currentUser.uid}`);
  } catch (error) {
    console.error("[Firebase] Error al eliminar de favoritos:", error);
    if (error instanceof Error) {
      console.error("[Firebase] Mensaje de error:", error.message);
    }
    throw new Error("No se pudo eliminar la aplicación de favoritos. Por favor, intente de nuevo más tarde.");
  }
}

/**
 * Verifica si una aplicación está en los favoritos del usuario.
 * 
 * @async
 * @param {string} appId - ID de la aplicación a verificar
 * @returns {Promise<boolean>} Verdadero si la app está en favoritos, falso en caso contrario
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
    console.error("[Firebase] Error al verificar favorito:", error);
    return false;
  }
}

/**
 * Obtiene todas las aplicaciones favoritas del usuario actual.
 * 
 * @async
 * @returns {Promise<AppData[]>} Lista de aplicaciones favoritas
 */
export async function getFavoriteApps(): Promise<AppData[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No hay usuario autenticado para obtener favoritos");
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
    console.error("[Firebase] Error al obtener favoritos:", error);
    return [];
  }
}

/**
 * Funciones para el registro de acceso a aplicaciones
 */

/**
 * Obtiene la referencia a la colección de historiales de acceso para el usuario actual.
 * Si no hay usuario autenticado, devuelve null.
 * 
 * @returns {CollectionReference<DocumentData> | null} Referencia a la colección de historial del usuario o null
 */
export function getUserHistoryRef(): CollectionReference<DocumentData> | null {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("[Firebase] No hay usuario autenticado para obtener referencias de historial");
    return null;
  }
  
  return collection(db, `users/${currentUser.uid}/history`);
}

/**
 * Registra un acceso a una aplicación en el historial del usuario.
 * 
 * @async
 * @param {AppData} app - Datos de la aplicación a la que se accedió
 * @returns {Promise<void>} Promesa que se resuelve cuando se completa la operación
 */
export async function recordAppAccess(app: AppData): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      // Si no hay usuario autenticado, no registramos nada pero no lanzamos error
      return;
    }
    
    const historyRef = getUserHistoryRef();
    if (!historyRef) {
      return;
    }
    
    // Usar un ID único para cada acceso
    const accessId = doc(historyRef).id;
    
    await setDoc(doc(historyRef, accessId), {
      appId: app.id,
      name: app.name,
      icon: app.icon,
      url: app.url,
      accessedAt: new Date().toISOString()
    });
    
    console.log(`[Firebase] Acceso registrado a: ${app.name} para usuario: ${currentUser.uid}`);
  } catch (error) {
    console.error("[Firebase] Error al registrar acceso:", error);
    // No lanzamos error para no interrumpir la experiencia del usuario
  }
}

/**
 * Obtiene el historial de accesos a aplicaciones del usuario actual.
 * Los resultados vienen ordenados del más reciente al más antiguo.
 * 
 * @async
 * @param {number} limitCount - Número máximo de registros a obtener (por defecto 10)
 * @returns {Promise<{appId: string, name: string, icon: string, url: string, accessedAt: string}[]>} Lista de accesos recientes
 */
export async function getRecentAppAccess(limitCount = 10): Promise<{appId: string, name: string, icon: string, url: string, accessedAt: string}[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No hay usuario autenticado para obtener historial");
      return [];
    }
    
    const historyRef = getUserHistoryRef();
    if (!historyRef) {
      return [];
    }
    
    // Ordenar por fecha de acceso descendente y limitar a la cantidad especificada
    const maxItems = limitCount > 0 ? limitCount : 10;
    // Usamos limitQuery (alias para la función limit de firebase/firestore)
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
      // Ordenamos manualmente ya que orderBy puede no funcionar en algunos entornos
      return new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime();
    });
  } catch (error) {
    console.error("[Firebase] Error al obtener historial:", error);
    return [];
  }
}

export { app, auth, db };
