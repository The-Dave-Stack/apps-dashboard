/**
 * @fileoverview Exportaciones del módulo de almacenamiento para Bookmark Manager Sync
 * @module storage
 */

import { StorageFactory } from './StorageFactory';
import type { IStorage } from './IStorage';

/**
 * Instancia de almacenamiento predeterminada basada en la configuración del entorno
 */
export const storage = StorageFactory.getStorage();

// Re-exportar la interfaz y los tipos
export { IStorage };
export { StorageFactory, type StorageType } from './StorageFactory';