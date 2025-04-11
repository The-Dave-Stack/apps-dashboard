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
   * Gets the storage type configured in environment variables
   * @returns The configured storage type
   */
  static getConfiguredStorageType(): StorageType {
    const databaseType = process.env.BMS_DATABASE?.toLowerCase() || 'firebase';
    
    if (databaseType === 'postgres') return 'postgres';
    if (databaseType === 'supabase') return 'supabase';
    
    return 'firebase'; // Default, use Firebase
  }

  /**
   * Creates and returns a storage instance based on configuration
   * @returns A storage instance implementing IStorage
   */
  static getStorage(): IStorage {
    if (!this.instance) {
      const storageType = this.getConfiguredStorageType();

      console.log(`[StorageFactory] Using storage: ${storageType}`);

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
   * Resets the storage instance
   * Useful for testing or when configuration changes
   */
  static resetStorage(): void {
    this.instance = null;
  }
}