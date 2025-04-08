/**
 * @fileoverview Interfaz de almacenamiento para Bookmark Manager Sync
 * Este módulo define la interfaz que deben implementar todos los proveedores
 * de almacenamiento para la aplicación.
 * @module storage/IStorage
 */

import { FirebaseCategory, FirebaseApp, FirebaseUser, UserRole } from '@shared/schema';

/**
 * Interfaz común para todos los proveedores de almacenamiento
 * 
 * Cualquier implementación (Firebase, PostgreSQL, etc) debe
 * implementar todos estos métodos.
 */
export interface IStorage {
  /**
   * Obtiene todas las categorías para un usuario específico
   * @param userId - ID del usuario
   * @returns Promise con array de categorías
   */
  getCategories(userId: string): Promise<FirebaseCategory[]>;
  
  /**
   * Obtiene una categoría específica por su ID
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @returns Promise con la categoría o null si no existe
   */
  getCategoryById(userId: string, categoryId: string): Promise<FirebaseCategory | null>;
  
  /**
   * Crea una nueva categoría
   * @param userId - ID del usuario
   * @param category - Datos de la categoría a crear
   * @returns Promise con la categoría creada incluyendo su ID
   */
  createCategory(userId: string, category: Omit<FirebaseCategory, 'id'>): Promise<FirebaseCategory>;
  
  /**
   * Actualiza una categoría existente
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @param category - Datos actualizados de la categoría
   * @returns Promise con la categoría actualizada
   */
  updateCategory(userId: string, categoryId: string, category: Partial<FirebaseCategory>): Promise<FirebaseCategory>;
  
  /**
   * Elimina una categoría
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @returns Promise que se resuelve cuando la categoría es eliminada
   */
  deleteCategory(userId: string, categoryId: string): Promise<void>;
  
  /**
   * Obtiene todas las aplicaciones para una categoría específica
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @returns Promise con array de aplicaciones
   */
  getApps(userId: string, categoryId: string): Promise<FirebaseApp[]>;
  
  /**
   * Obtiene una aplicación específica
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @param appId - ID de la aplicación
   * @returns Promise con la aplicación o null si no existe
   */
  getAppById(userId: string, categoryId: string, appId: string): Promise<FirebaseApp | null>;
  
  /**
   * Crea una nueva aplicación en una categoría
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @param app - Datos de la aplicación a crear
   * @returns Promise con la aplicación creada incluyendo su ID
   */
  createApp(userId: string, categoryId: string, app: Omit<FirebaseApp, 'id'>): Promise<FirebaseApp>;
  
  /**
   * Actualiza una aplicación existente
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @param appId - ID de la aplicación
   * @param app - Datos actualizados de la aplicación
   * @returns Promise con la aplicación actualizada
   */
  updateApp(userId: string, categoryId: string, appId: string, app: Partial<FirebaseApp>): Promise<FirebaseApp>;
  
  /**
   * Elimina una aplicación
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @param appId - ID de la aplicación
   * @returns Promise que se resuelve cuando la aplicación es eliminada
   */
  deleteApp(userId: string, categoryId: string, appId: string): Promise<void>;
  
  /**
   * Marca o desmarca una aplicación como favorita
   * @param userId - ID del usuario
   * @param appId - ID de la aplicación
   * @param isFavorite - Indica si la aplicación es favorita o no
   * @returns Promise que se resuelve cuando la operación se completa
   */
  toggleFavorite(userId: string, appId: string, isFavorite: boolean): Promise<void>;
  
  /**
   * Obtiene todas las aplicaciones favoritas de un usuario
   * @param userId - ID del usuario
   * @returns Promise con array de aplicaciones favoritas
   */
  getFavorites(userId: string): Promise<FirebaseApp[]>;
  
  /**
   * Verifica si una aplicación es favorita
   * @param userId - ID del usuario
   * @param appId - ID de la aplicación
   * @returns Promise con un booleano indicando si es favorita
   */
  isFavorite(userId: string, appId: string): Promise<boolean>;
  
  /**
   * Registra un acceso a una aplicación
   * @param userId - ID del usuario
   * @param appId - ID de la aplicación
   * @returns Promise que se resuelve cuando el acceso es registrado
   */
  recordAccess(userId: string, appId: string): Promise<void>;
  
  /**
   * Obtiene las aplicaciones accedidas recientemente
   * @param userId - ID del usuario
   * @param limitCount - Número máximo de aplicaciones a devolver
   * @returns Promise con array de aplicaciones recientes
   */
  getRecentApps(userId: string, limitCount?: number): Promise<FirebaseApp[]>;
  
  /**
   * Busca aplicaciones por término de búsqueda
   * @param userId - ID del usuario
   * @param searchTerm - Término de búsqueda
   * @returns Promise con array de aplicaciones que coinciden con la búsqueda
   */
  searchApps(userId: string, searchTerm: string): Promise<FirebaseApp[]>;
  
  /**
   * Obtiene la configuración global de la aplicación
   * @returns Promise con la configuración de la aplicación
   */
  getAppConfig(): Promise<Record<string, any>>;
  
  /**
   * Actualiza la configuración global de la aplicación
   * @param config - Configuración parcial a actualizar
   * @returns Promise con la configuración actualizada
   */
  updateAppConfig(config: Record<string, any>): Promise<Record<string, any>>;
  
  /**
   * Obtiene todos los usuarios registrados en el sistema
   * @returns Promise con array de usuarios
   */
  getUsers(): Promise<FirebaseUser[]>;
  
  /**
   * Obtiene un usuario específico por su ID
   * @param userId - ID del usuario
   * @returns Promise con el usuario o null si no existe
   */
  getUserById(userId: string): Promise<FirebaseUser | null>;
  
  /**
   * Actualiza el rol de un usuario
   * @param userId - ID del usuario
   * @param role - Nuevo rol para el usuario
   * @returns Promise con el usuario actualizado
   */
  updateUserRole(userId: string, role: UserRole): Promise<FirebaseUser>;
  
  /**
   * Activa o desactiva un usuario
   * @param userId - ID del usuario
   * @param disabled - Indica si el usuario debe ser desactivado
   * @returns Promise con el usuario actualizado
   */
  toggleUserStatus(userId: string, disabled: boolean): Promise<FirebaseUser>;
  
  /**
   * Elimina un usuario
   * @param userId - ID del usuario
   * @returns Promise que se resuelve cuando el usuario es eliminado
   */
  deleteUser(userId: string): Promise<void>;
  
  /**
   * Verifica si hay usuarios en el sistema
   * @returns Promise con un booleano indicando si hay usuarios
   */
  hasUsers(): Promise<boolean>;
}