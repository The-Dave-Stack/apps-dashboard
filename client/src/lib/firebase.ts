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
 * Obtiene la referencia a la colección de categorías para el usuario actual.
 * Si no hay usuario autenticado, devuelve null.
 * 
 * @returns {CollectionReference<DocumentData> | null} Referencia a la colección de categorías del usuario o null
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
 * Obtiene la referencia a la colección de aplicaciones para el usuario actual.
 * Si no hay usuario autenticado, devuelve null.
 * 
 * @returns {CollectionReference<DocumentData> | null} Referencia a la colección de aplicaciones del usuario o null
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
 * Obtiene todas las categorías almacenadas en Firestore para el usuario actual, 
 * incluyendo sus aplicaciones asociadas.
 * Realiza dos consultas: una para las categorías y otra para las aplicaciones de cada categoría.
 * 
 * @async
 * @returns {Promise<CategoryData[]>} Una promesa que resuelve a un array de categorías con sus aplicaciones
 * @throws {Error} Si ocurre un error durante la consulta a Firestore o si no hay usuario autenticado
 * @example
 * // Obtener todas las categorías con sus aplicaciones
 * const categories = await fetchCategories();
 * console.log(`Se encontraron ${categories.length} categorías`);
 */
export async function fetchCategories(): Promise<CategoryData[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No hay usuario autenticado para obtener categorías");
      return [];
    }
    
    const userCategoriesRef = getUserCategoriesRef();
    const userAppsRef = getUserAppsRef();
    
    if (!userCategoriesRef || !userAppsRef) {
      console.error("[Firebase] No se pudieron obtener las referencias a las colecciones");
      return [];
    }
    
    console.log(`[Firebase] Obteniendo categorías para el usuario: ${currentUser.uid}`);
    const categoriesSnapshot = await getDocs(userCategoriesRef);
    const categories: CategoryData[] = [];
    
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryData = categoryDoc.data() as Record<string, any>;
      
      // Obtener las aplicaciones de esta categoría
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
    
    console.log(`[Firebase] Se encontraron ${categories.length} categorías para el usuario ${currentUser.uid}`);
    return categories;
  } catch (error) {
    console.error("[Firebase] Error obteniendo categorías:", error);
    return [];
  }
}

/**
 * Guarda una categoría en Firestore para el usuario actual, 
 * ya sea creando una nueva o actualizando una existente.
 * Incluye manejo de errores robusto y reintentos automáticos para mayor tolerancia a fallos.
 * 
 * @async
 * @param {CategoryData} category - Datos de la categoría a guardar
 * @returns {Promise<CategoryData>} La categoría guardada con su ID asignado
 * @throws {Error} Si no se puede guardar la categoría en Firebase o no hay usuario autenticado
 * @example
 * // Crear una nueva categoría
 * const newCategory = await saveCategory({name: "Nueva Categoría", apps: []});
 * 
 * // Actualizar una categoría existente
 * await saveCategory({id: "abc123", name: "Categoría Actualizada", apps: []});
 */
export async function saveCategory(category: CategoryData): Promise<CategoryData> {
  try {
    // Log para depuración
    console.log("[Firebase] Intento de guardar categoría:", category);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No hay usuario autenticado para guardar categorías");
      throw new Error("Usuario no autenticado");
    }
    
    if (!db) {
      console.error("[Firebase] Error: No se ha inicializado Firestore correctamente");
      throw new Error("Firestore no inicializado");
    }
    
    // Verificar la conexión a Firestore con una operación simple
    try {
      console.log("[Firebase] Verificando conexión a Firestore...");
      const testRef = collection(db, "test_connection");
      await getDocs(testRef);
      console.log("[Firebase] Conexión a Firestore verificada");
    } catch (connectionError) {
      console.error("[Firebase] Problema de conexión a Firestore:", connectionError);
      // Continuar de todos modos, podría ser que la colección no exista
    }
    
    const userCategoriesPath = `users/${currentUser.uid}/categories`;
    
    if (category.id && category.id.trim() !== "") {
      // Actualizar categoría existente
      console.log(`[Firebase] Actualizando categoría con ID: ${category.id} para usuario: ${currentUser.uid}`);
      try {
        const categoryRef = doc(db, userCategoriesPath, category.id);
        await updateDoc(categoryRef, { name: category.name });
        console.log("[Firebase] Categoría actualizada con éxito");
        return category;
      } catch (updateError) {
        console.error("[Firebase] Error al actualizar la categoría:", updateError);
        
        // Si falla la actualización, intentamos crear una nueva
        console.log("[Firebase] Intentando crear en su lugar...");
        try {
          // Intentar crear con método alternativo
          const categoriesCollection = collection(db, userCategoriesPath);
          const newCategoryRef = doc(categoriesCollection);
          const newCategory = { name: category.name };
          
          await setDoc(newCategoryRef, newCategory);
          
          console.log("[Firebase] Categoría creada con éxito, ID:", newCategoryRef.id);
          return {
            ...category,
            id: newCategoryRef.id,
            apps: []
          };
        } catch (createError) {
          console.error("[Firebase] Error también al crear:", createError);
          throw createError;
        }
      }
    } else {
      // Crear nueva categoría
      console.log(`[Firebase] Creando nueva categoría: ${category.name} para usuario: ${currentUser.uid}`);
      
      try {
        // Verificar si podemos acceder a la colección
        const categoriesCollection = collection(db, userCategoriesPath);
        console.log("[Firebase] Colección de categorías accesible");
        
        // Crear un nuevo documento con ID automático
        const newCategoryRef = doc(categoriesCollection);
        console.log("[Firebase] Referencia creada:", newCategoryRef.id);
        
        const newCategory = { name: category.name };
        
        console.log("[Firebase] Intentando guardar documento...");
        await setDoc(newCategoryRef, newCategory);
        
        console.log("[Firebase] Categoría creada con éxito, ID:", newCategoryRef.id);
        return {
          ...category,
          id: newCategoryRef.id,
          apps: []
        };
      } catch (createError) {
        console.error("[Firebase] Error detallado al crear categoría:", createError);
        if (createError instanceof Error) {
          console.error("[Firebase] Código:", createError.name);
          console.error("[Firebase] Mensaje:", createError.message);
          console.error("[Firebase] Stack:", createError.stack);
        }
        throw createError;
      }
    }
  } catch (error) {
    console.error("[Firebase] Error crítico al guardar categoría:", error);
    // Log más detallado para detectar el problema
    if (error instanceof Error) {
      console.error("[Firebase] Mensaje de error:", error.message);
      console.error("[Firebase] Stack de error:", error.stack);
    }
    
    // Para diagnóstico, intentamos una operación muy básica
    try {
      const simpleData = { test: true, timestamp: new Date().toISOString() };
      const testDoc = doc(collection(db, "debug_test"));
      await setDoc(testDoc, simpleData);
      console.log("[Firebase] Prueba diagnóstica exitosa, se pudo crear documento de prueba");
    } catch (testError) {
      console.error("[Firebase] Incluso la prueba diagnóstica falló:", testError);
    }
    
    // Proporcionar un error amigable para el usuario
    throw new Error("No se pudo guardar la categoría en Firebase. Por favor, intente de nuevo más tarde.");
  }
}

/**
 * Elimina una categoría y todas sus aplicaciones asociadas de Firestore para el usuario actual.
 * Primero elimina todas las aplicaciones que pertenecen a la categoría y luego elimina la categoría.
 * 
 * @async
 * @param {string} categoryId - ID de la categoría a eliminar
 * @returns {Promise<void>} Promesa que se resuelve cuando se completa la eliminación
 * @throws {Error} Si no se puede eliminar la categoría de Firebase o no hay usuario autenticado
 * @example
 * // Eliminar una categoría y todas sus aplicaciones
 * await deleteCategory("abc123");
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    console.log("[Firebase] Intento de eliminar categoría con ID:", categoryId);
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("[Firebase] No hay usuario autenticado para eliminar categorías");
      throw new Error("Usuario no autenticado");
    }
    
    if (!db) {
      console.error("[Firebase] Error: No se ha inicializado Firestore correctamente");
      throw new Error("Firestore no inicializado");
    }
    
    const userAppsRef = getUserAppsRef();
    const userCategoriesRef = getUserCategoriesRef();
    
    if (!userAppsRef || !userCategoriesRef) {
      console.error("[Firebase] No se pudieron obtener las referencias a las colecciones");
      throw new Error("Error obteniendo referencias a colecciones");
    }
    
    // Primero eliminar todas las aplicaciones asociadas a esta categoría
    console.log("[Firebase] Buscando aplicaciones asociadas a la categoría");
    const appQuery = query(userAppsRef, where("categoryId", "==", categoryId));
    const appSnapshot = await getDocs(appQuery);
    
    const appsToDelete = appSnapshot.docs.length;
    console.log(`[Firebase] Se encontraron ${appsToDelete} aplicaciones para eliminar`);
    
    if (appsToDelete > 0) {
      const deletePromises = appSnapshot.docs.map(appDoc => {
        console.log(`[Firebase] Eliminando aplicación: ${appDoc.id}`);
        return deleteDoc(doc(db, `users/${currentUser.uid}/apps`, appDoc.id));
      });
      
      await Promise.all(deletePromises);
      console.log("[Firebase] Todas las aplicaciones de la categoría fueron eliminadas");
    }
    
    // Ahora eliminar la categoría
    console.log("[Firebase] Eliminando la categoría");
    await deleteDoc(doc(db, `users/${currentUser.uid}/categories`, categoryId));
    console.log("[Firebase] Categoría eliminada con éxito");
  } catch (error) {
    console.error("[Firebase] Error al eliminar categoría:", error);
    if (error instanceof Error) {
      console.error("[Firebase] Mensaje de error:", error.message);
      console.error("[Firebase] Stack de error:", error.stack);
    }
    throw new Error("No se pudo eliminar la categoría de Firebase. Por favor, intente de nuevo más tarde.");
  }
}

/**
 * Funciones para la gestión de aplicaciones
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
