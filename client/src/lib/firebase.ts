import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import type { CategoryData, AppData } from "@/lib/types";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Log the Firebase configuration (without sensitive values)
console.log("Firebase initialized with project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
    if (category.id) {
      // Actualizar categoría existente
      const categoryRef = doc(db, "categories", category.id);
      await updateDoc(categoryRef, { name: category.name });
      return category;
    } else {
      // Crear nueva categoría
      const newCategoryRef = doc(categoriesRef);
      const newCategory = {
        name: category.name
      };
      
      await setDoc(newCategoryRef, newCategory);
      return {
        ...category,
        id: newCategoryRef.id,
        apps: []
      };
    }
  } catch (error) {
    console.error("Error saving category:", error);
    throw error;
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    // Eliminar la categoría
    await deleteDoc(doc(db, "categories", categoryId));
    
    // Eliminar todas las aplicaciones asociadas a esta categoría
    const appQuery = query(appsRef, where("categoryId", "==", categoryId));
    const appSnapshot = await getDocs(appQuery);
    
    const deletePromises = appSnapshot.docs.map(appDoc => 
      deleteDoc(doc(db, "apps", appDoc.id))
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}

// Funciones para la gestión de aplicaciones
export async function saveApp(app: AppData, categoryId: string): Promise<AppData> {
  try {
    if (app.id) {
      // Actualizar app existente
      const appRef = doc(db, "apps", app.id);
      await updateDoc(appRef, { 
        name: app.name,
        icon: app.icon,
        url: app.url,
        description: app.description || '',
        categoryId
      });
      return app;
    } else {
      // Crear nueva app
      const newAppRef = doc(appsRef);
      const newApp = {
        name: app.name,
        icon: app.icon,
        url: app.url,
        description: app.description || '',
        categoryId
      };
      
      await setDoc(newAppRef, newApp);
      return {
        ...app,
        id: newAppRef.id
      };
    }
  } catch (error) {
    console.error("Error saving app:", error);
    throw error;
  }
}

export async function deleteApp(appId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "apps", appId));
  } catch (error) {
    console.error("Error deleting app:", error);
    throw error;
  }
}

export { app, auth, db };
