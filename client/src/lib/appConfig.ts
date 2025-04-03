import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseInstances } from "./firebase-init";

// Definición del tipo de configuración
export interface AppConfig {
  showRegisterTab: boolean;
}

// Valores predeterminados
const DEFAULT_CONFIG: AppConfig = {
  showRegisterTab: true
};

// Obtenemos la instancia de Firestore
const { db } = getFirebaseInstances();

// Referencia a la colección de configuración
const configRef = collection(db, "appConfig");
const configDocId = "globalConfig";

/**
 * Obtiene la configuración global de la aplicación
 */
export async function getAppConfig(): Promise<AppConfig> {
  try {
    const docRef = doc(configRef, configDocId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as AppConfig;
      return { ...DEFAULT_CONFIG, ...data };
    } else {
      // Si no existe, crear con valores predeterminados
      await setDoc(docRef, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Actualiza la configuración global de la aplicación
 */
export async function updateAppConfig(config: Partial<AppConfig>): Promise<AppConfig> {
  try {
    const docRef = doc(configRef, configDocId);
    
    // Obtener configuración actual
    const currentConfig = await getAppConfig();
    
    // Combinar configuración actual con nuevos valores
    const updatedConfig = {
      ...currentConfig,
      ...config
    };
    
    // Guardar configuración actualizada
    await setDoc(docRef, updatedConfig);
    
    return updatedConfig;
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    throw error;
  }
}