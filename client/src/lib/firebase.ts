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
  Firestore,
  CollectionReference,
  DocumentData
} from "firebase/firestore";
import type { CategoryData, AppData } from "@/lib/types";
import { getFirebaseInstances } from "./firebase-init";

// Obtener instancias de Firebase (inicialización controlada)
const { app, auth, db } = getFirebaseInstances();

// Colecciones
export const categoriesRef = collection(db, "categories");
export const appsRef = collection(db, "apps");

// Funciones para la gestión de categorías
export async function fetchCategories(): Promise<CategoryData[]> {
  try {
    const categoriesSnapshot = await getDocs(categoriesRef);
    const categories: CategoryData[] = [];
    
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryData = categoryDoc.data();
      
      // Obtener las aplicaciones de esta categoría
      const appQuery = query(appsRef, where("categoryId", "==", categoryDoc.id));
      const appSnapshot = await getDocs(appQuery);
      
      const apps: AppData[] = appSnapshot.docs.map(appDoc => ({
        id: appDoc.id,
        name: appDoc.data().name,
        icon: appDoc.data().icon,
        url: appDoc.data().url,
        description: appDoc.data().description || ''
      }));
      
      categories.push({
        id: categoryDoc.id,
        name: categoryData.name,
        apps
      });
    }
    
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function saveCategory(category: CategoryData): Promise<CategoryData> {
  try {
    // Log para depuración
    console.log("[Firebase] Intento de guardar categoría:", category);
    
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
    
    if (category.id && category.id.trim() !== "") {
      // Actualizar categoría existente
      console.log("[Firebase] Actualizando categoría con ID:", category.id);
      try {
        const categoryRef = doc(db, "categories", category.id);
        await updateDoc(categoryRef, { name: category.name });
        console.log("[Firebase] Categoría actualizada con éxito");
        return category;
      } catch (updateError) {
        console.error("[Firebase] Error al actualizar la categoría:", updateError);
        
        // Si falla la actualización, intentamos crear una nueva
        console.log("[Firebase] Intentando crear en su lugar...");
        try {
          // Intentar crear con método alternativo
          const categoriesCollection = collection(db, "categories");
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
      console.log("[Firebase] Creando nueva categoría:", category.name);
      
      try {
        // Verificar si podemos acceder a la colección
        const categoriesCollection = collection(db, "categories");
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

export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    console.log("[Firebase] Intento de eliminar categoría con ID:", categoryId);
    
    if (!db) {
      console.error("[Firebase] Error: No se ha inicializado Firestore correctamente");
      throw new Error("Firestore no inicializado");
    }
    
    // Primero eliminar todas las aplicaciones asociadas a esta categoría
    console.log("[Firebase] Buscando aplicaciones asociadas a la categoría");
    const appQuery = query(appsRef, where("categoryId", "==", categoryId));
    const appSnapshot = await getDocs(appQuery);
    
    const appsToDelete = appSnapshot.docs.length;
    console.log(`[Firebase] Se encontraron ${appsToDelete} aplicaciones para eliminar`);
    
    if (appsToDelete > 0) {
      const deletePromises = appSnapshot.docs.map(appDoc => {
        console.log(`[Firebase] Eliminando aplicación: ${appDoc.id}`);
        return deleteDoc(doc(db, "apps", appDoc.id));
      });
      
      await Promise.all(deletePromises);
      console.log("[Firebase] Todas las aplicaciones de la categoría fueron eliminadas");
    }
    
    // Ahora eliminar la categoría
    console.log("[Firebase] Eliminando la categoría");
    await deleteDoc(doc(db, "categories", categoryId));
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

// Funciones para la gestión de aplicaciones
export async function saveApp(app: AppData, categoryId: string): Promise<AppData> {
  try {
    console.log("[Firebase] Intento de guardar aplicación:", app, "en categoría:", categoryId);
    
    if (!db) {
      console.error("[Firebase] Error: No se ha inicializado Firestore correctamente");
      throw new Error("Firestore no inicializado");
    }
    
    if (app.id) {
      // Actualizar app existente
      console.log("[Firebase] Actualizando aplicación existente con ID:", app.id);
      try {
        const appRef = doc(db, "apps", app.id);
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
        const newAppRef = doc(collection(db, "apps"));
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
      console.log("[Firebase] Creando nueva aplicación:", app.name);
      const newAppRef = doc(collection(db, "apps"));
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

export async function deleteApp(appId: string): Promise<void> {
  try {
    console.log("[Firebase] Intento de eliminar aplicación con ID:", appId);
    
    if (!db) {
      console.error("[Firebase] Error: No se ha inicializado Firestore correctamente");
      throw new Error("Firestore no inicializado");
    }
    
    await deleteDoc(doc(db, "apps", appId));
    console.log("[Firebase] Aplicación eliminada con éxito");
  } catch (error) {
    console.error("[Firebase] Error al eliminar aplicación:", error);
    if (error instanceof Error) {
      console.error("[Firebase] Mensaje de error:", error.message);
      console.error("[Firebase] Stack de error:", error.stack);
    }
    throw new Error("No se pudo eliminar la aplicación de Firebase. Por favor, intente de nuevo más tarde.");
  }
}

export { app, auth, db };
