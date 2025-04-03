import { getFirebaseInstances } from './firebase-init';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

interface FirebaseCheckResult {
  connection: boolean;
  read: boolean;
  write: boolean;
  error?: string;
}

/**
 * Función que intenta comprobar el estado de la conexión a Firebase
 * y los permisos para leer/escribir en Firestore
 */
export async function checkFirebaseConnection(): Promise<FirebaseCheckResult> {
  const result: FirebaseCheckResult = {
    connection: false,
    read: false,
    write: false
  };

  try {
    console.log("[Firebase-Check] Iniciando comprobación de Firebase...");
    
    // 1. Obtenemos las instancias de Firebase
    const { db } = getFirebaseInstances();
    if (!db) {
      result.error = "No se pudo inicializar Firestore";
      return result;
    }
    
    result.connection = true;
    console.log("[Firebase-Check] Conexión a Firebase establecida correctamente");
    
    // 2. Intentamos leer de una colección
    try {
      console.log("[Firebase-Check] Intentando leer datos...");
      const testCollection = collection(db, "firebase_test");
      const snapshot = await getDocs(testCollection);
      result.read = true;
      console.log(`[Firebase-Check] Lectura exitosa. Documentos encontrados: ${snapshot.size}`);
    } catch (readError) {
      console.error("[Firebase-Check] Error al leer datos:", readError);
      if (readError instanceof Error) {
        result.error = `Error de lectura: ${readError.message}`;
      }
    }
    
    // 3. Intentamos escribir en una colección de prueba
    try {
      console.log("[Firebase-Check] Intentando escribir datos de prueba...");
      const testDoc = doc(collection(db, "firebase_test"));
      await setDoc(testDoc, {
        test: true,
        timestamp: new Date().toISOString(),
        message: "Prueba de escritura"
      });
      result.write = true;
      console.log("[Firebase-Check] Escritura exitosa");
    } catch (writeError) {
      console.error("[Firebase-Check] Error al escribir datos:", writeError);
      if (writeError instanceof Error) {
        result.error = `Error de escritura: ${writeError.message}`;
      }
    }
    
    return result;
  } catch (error) {
    console.error("[Firebase-Check] Error general en la comprobación:", error);
    if (error instanceof Error) {
      result.error = error.message;
    } else {
      result.error = "Error desconocido";
    }
    return result;
  }
}