/**
 * @fileoverview Fábrica de almacenamiento para Bookmark Manager Sync
 * Este módulo proporciona una fábrica que crea una instancia de almacenamiento
 * según la configuración de la variable de entorno BMS_DATABASE.
 * @module storage/StorageFactory
 */

import { IStorage } from './IStorage';
import { FirebaseStorage } from './FirebaseStorage';
import { PostgresStorage } from './PostgresStorage';

/**
 * Tipos de almacenamiento soportados
 */
export type StorageType = 'firebase' | 'postgres';

/**
 * Clase fábrica que proporciona una instancia de almacenamiento
 * basada en la configuración del entorno.
 */
export class StorageFactory {
  private static instance: IStorage | null = null;

  /**
   * Obtiene el tipo de almacenamiento configurado en las variables de entorno
   * @returns El tipo de almacenamiento configurado
   */
  static getConfiguredStorageType(): StorageType {
    const databaseType = process.env.BMS_DATABASE?.toLowerCase() || 'firebase';
    return databaseType === 'postgres' ? 'postgres' : 'firebase';
  }

  /**
   * Crea y devuelve una instancia de almacenamiento según la configuración
   * @returns Una instancia de almacenamiento que implementa IStorage
   */
  static getStorage(): IStorage {
    if (!this.instance) {
      const storageType = this.getConfiguredStorageType();

      console.log(`[StorageFactory] Usando almacenamiento: ${storageType}`);

      if (storageType === 'postgres') {
        this.instance = new PostgresStorage();
      } else {
        this.instance = new FirebaseStorage();
      }
    }

    return this.instance;
  }

  /**
   * Reinicia la instancia de almacenamiento
   * Útil para pruebas o cuando cambia la configuración
   */
  static resetStorage(): void {
    this.instance = null;
  }
}