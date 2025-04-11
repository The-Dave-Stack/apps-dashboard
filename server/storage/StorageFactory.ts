/**
 * @fileoverview Storage factory for Bookmark Manager Sync
 * This module provides a factory that creates a storage instance
 * based on the BMS_DATABASE environment variable configuration.
 * @module storage/StorageFactory
 */

import { IStorage } from './IStorage';
import { FirebaseStorage } from './FirebaseStorage';
import { PostgresStorage } from './PostgresStorage';
import { SupabaseStorage } from './SupabaseStorage';

/**
 * Supported storage types
 */
export type StorageType = 'firebase' | 'postgres' | 'supabase';

/**
 * Factory class that provides a storage instance
 * based on environment configuration.
 */
export class StorageFactory {
  private static instance: IStorage | null = null;

  /**
   * Obtiene el tipo de almacenamiento configurado en las variables de entorno
   * @returns El tipo de almacenamiento configurado
   */
  static getConfiguredStorageType(): StorageType {
    const databaseType = process.env.BMS_DATABASE?.toLowerCase() || 'firebase';
    
    if (databaseType === 'postgres') return 'postgres';
    if (databaseType === 'supabase') return 'supabase';
    
    return 'firebase'; // Por defecto, usar Firebase
  }

  /**
   * Crea y devuelve una instancia de almacenamiento según la configuración
   * @returns Una instancia de almacenamiento que implementa IStorage
   */
  static getStorage(): IStorage {
    if (!this.instance) {
      const storageType = this.getConfiguredStorageType();

      console.log(`[StorageFactory] Usando almacenamiento: ${storageType}`);

      switch (storageType) {
        case 'postgres':
          this.instance = new PostgresStorage();
          break;
        case 'supabase':
          this.instance = new SupabaseStorage();
          break;
        default:
          this.instance = new FirebaseStorage();
          break;
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