/**
 * @fileoverview Implementación de almacenamiento con PostgreSQL para Bookmark Manager Sync
 * Este módulo implementa la interfaz IStorage utilizando PostgreSQL como backend.
 * @module storage/PostgresStorage
 */

import { IStorage } from './IStorage';
import { FirebaseCategory, FirebaseApp } from '@shared/schema';
import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Implementación de almacenamiento utilizando PostgreSQL
 * @class PostgresStorage
 * @implements {IStorage}
 */
export class PostgresStorage implements IStorage {
  constructor() {
    // Asegurarse de que las tablas existan (ejecución de migraciones)
    this.initializeDatabase();
  }
  
  /**
   * Inicializa la base de datos, creando las tablas necesarias si no existen
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Verificar si la tabla categories existe
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'bms_categories'
        );
      `);
      
      const tableExists = result.rows[0].exists;
      
      if (!tableExists) {
        console.log('[Postgres] Creando esquema de base de datos...');
        
        // Crear tabla de categorías
        await db.execute(sql`
          CREATE TABLE bms_categories (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, name)
          );
        `);
        
        // Crear tabla de aplicaciones
        await db.execute(sql`
          CREATE TABLE bms_apps (
            id TEXT PRIMARY KEY,
            category_id TEXT REFERENCES bms_categories(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            icon TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Crear tabla de favoritos
        await db.execute(sql`
          CREATE TABLE bms_favorites (
            user_id TEXT NOT NULL,
            app_id TEXT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(user_id, app_id),
            FOREIGN KEY(app_id) REFERENCES bms_apps(id) ON DELETE CASCADE
          );
        `);
        
        // Crear tabla de historial de acceso
        await db.execute(sql`
          CREATE TABLE bms_access_history (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            app_id TEXT NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(app_id) REFERENCES bms_apps(id) ON DELETE CASCADE
          );
        `);
        
        // Crear tabla de configuración
        await db.execute(sql`
          CREATE TABLE bms_config (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL
          );
        `);
        
        // Insertar configuración predeterminada
        await db.execute(sql`
          INSERT INTO bms_config (key, value)
          VALUES ('appConfig', '{"showRegisterTab": true}'::jsonb);
        `);
        
        console.log('[Postgres] Esquema de base de datos creado correctamente');
      }
    } catch (error) {
      console.error('[Postgres] Error al inicializar la base de datos:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene todas las categorías para un usuario específico
   * @param userId - ID del usuario
   * @returns Promise con array de categorías
   */
  async getCategories(userId: string): Promise<FirebaseCategory[]> {
    try {
      console.log(`[Postgres] Obteniendo categorías para el usuario: ${userId}`);
      
      // Obtener todas las categorías del usuario
      const categoriesResult = await db.execute(sql`
        SELECT id, name
        FROM bms_categories
        WHERE user_id = ${userId}
        ORDER BY name;
      `);
      
      const categories: FirebaseCategory[] = [];
      
      // Para cada categoría, obtener sus aplicaciones
      for (const categoryRow of categoriesResult.rows) {
        const appsResult = await db.execute(sql`
          SELECT id, name, url, icon, description
          FROM bms_apps
          WHERE category_id = ${categoryRow.id}
          ORDER BY name;
        `);
        
        const apps: FirebaseApp[] = appsResult.rows.map(row => ({
          id: String(row.id),
          name: String(row.name),
          url: String(row.url),
          icon: String(row.icon),
          description: row.description ? String(row.description) : undefined,
        }));
        
        categories.push({
          id: String(categoryRow.id),
          name: String(categoryRow.name),
          apps: apps,
        });
      }
      
      console.log(`[Postgres] Se encontraron ${categories.length} categorías para el usuario ${userId}`);
      return categories;
    } catch (error) {
      console.error('[Postgres] Error al obtener categorías:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene una categoría específica por su ID
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @returns Promise con la categoría o null si no existe
   */
  async getCategoryById(userId: string, categoryId: string): Promise<FirebaseCategory | null> {
    try {
      // Obtener la categoría
      const categoryResult = await db.execute(sql`
        SELECT id, name
        FROM bms_categories
        WHERE id = ${categoryId} AND user_id = ${userId};
      `);
      
      if (categoryResult.rows.length === 0) {
        return null;
      }
      
      const categoryRow = categoryResult.rows[0];
      
      // Obtener las aplicaciones de esta categoría
      const appsResult = await db.execute(sql`
        SELECT id, name, url, icon, description
        FROM bms_apps
        WHERE category_id = ${categoryId}
        ORDER BY name;
      `);
      
      const apps: FirebaseApp[] = appsResult.rows.map(row => ({
        id: String(row.id),
        name: String(row.name),
        url: String(row.url),
        icon: String(row.icon),
        description: row.description ? String(row.description) : undefined,
      }));
      
      return {
        id: String(categoryRow.id),
        name: String(categoryRow.name),
        apps: apps,
      };
    } catch (error) {
      console.error(`[Postgres] Error al obtener categoría ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Crea una nueva categoría
   * @param userId - ID del usuario
   * @param category - Datos de la categoría a crear
   * @returns Promise con la categoría creada incluyendo su ID
   */
  async createCategory(userId: string, category: Omit<FirebaseCategory, 'id'>): Promise<FirebaseCategory> {
    try {
      const categoryId = crypto.randomUUID();
      
      // Insertar la categoría
      await db.execute(sql`
        INSERT INTO bms_categories (id, user_id, name)
        VALUES (${categoryId}, ${userId}, ${category.name});
      `);
      
      // Si la categoría incluye aplicaciones, insertarlas
      const apps: FirebaseApp[] = [];
      
      if (category.apps && category.apps.length > 0) {
        for (const app of category.apps) {
          const appId = crypto.randomUUID();
          
          await db.execute(sql`
            INSERT INTO bms_apps (id, category_id, name, url, icon, description)
            VALUES (${appId}, ${categoryId}, ${app.name}, ${app.url}, ${app.icon}, ${app.description || null});
          `);
          
          apps.push({
            id: appId,
            name: app.name,
            url: app.url,
            icon: app.icon,
            description: app.description,
          });
        }
      }
      
      return {
        id: categoryId,
        name: category.name,
        apps: apps,
      };
    } catch (error) {
      console.error('[Postgres] Error al crear categoría:', error);
      throw error;
    }
  }
  
  /**
   * Actualiza una categoría existente
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @param category - Datos actualizados de la categoría
   * @returns Promise con la categoría actualizada
   */
  async updateCategory(userId: string, categoryId: string, category: Partial<FirebaseCategory>): Promise<FirebaseCategory> {
    try {
      // Verificar que la categoría exista y pertenezca al usuario
      const existingCategory = await this.getCategoryById(userId, categoryId);
      if (!existingCategory) {
        throw new Error(`Categoría ${categoryId} no encontrada o no pertenece al usuario ${userId}`);
      }
      
      // Actualizar el nombre si se proporciona
      if (category.name !== undefined) {
        await db.execute(sql`
          UPDATE bms_categories
          SET name = ${category.name}
          WHERE id = ${categoryId} AND user_id = ${userId};
        `);
      }
      
      // Si se proporcionan aplicaciones, reemplazar las existentes
      if (category.apps !== undefined) {
        // Primero, eliminar todas las aplicaciones existentes
        await db.execute(sql`
          DELETE FROM bms_apps
          WHERE category_id = ${categoryId};
        `);
        
        // Luego, insertar las nuevas aplicaciones
        for (const app of category.apps) {
          const appId = app.id || crypto.randomUUID();
          
          await db.execute(sql`
            INSERT INTO bms_apps (id, category_id, name, url, icon, description)
            VALUES (${appId}, ${categoryId}, ${app.name}, ${app.url}, ${app.icon}, ${app.description || null});
          `);
        }
      }
      
      // Obtener la categoría actualizada
      const updatedCategory = await this.getCategoryById(userId, categoryId);
      if (!updatedCategory) {
        throw new Error(`Categoría ${categoryId} no encontrada después de actualizar`);
      }
      
      return updatedCategory;
    } catch (error) {
      console.error(`[Postgres] Error al actualizar categoría ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Elimina una categoría
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @returns Promise que se resuelve cuando la categoría es eliminada
   */
  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    try {
      // Verificar que la categoría exista y pertenezca al usuario
      const existingCategory = await this.getCategoryById(userId, categoryId);
      if (!existingCategory) {
        throw new Error(`Categoría ${categoryId} no encontrada o no pertenece al usuario ${userId}`);
      }
      
      // Eliminar la categoría (las aplicaciones se eliminarán en cascada)
      await db.execute(sql`
        DELETE FROM bms_categories
        WHERE id = ${categoryId} AND user_id = ${userId};
      `);
    } catch (error) {
      console.error(`[Postgres] Error al eliminar categoría ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtiene todas las aplicaciones para una categoría específica
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @returns Promise con array de aplicaciones
   */
  async getApps(userId: string, categoryId: string): Promise<FirebaseApp[]> {
    try {
      // Verificar que la categoría exista y pertenezca al usuario
      const existingCategory = await this.getCategoryById(userId, categoryId);
      if (!existingCategory) {
        return [];
      }
      
      return existingCategory.apps;
    } catch (error) {
      console.error(`[Postgres] Error al obtener aplicaciones de categoría ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtiene una aplicación específica
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @param appId - ID de la aplicación
   * @returns Promise con la aplicación o null si no existe
   */
  async getAppById(userId: string, categoryId: string, appId: string): Promise<FirebaseApp | null> {
    try {
      // Verificar que la categoría exista y pertenezca al usuario
      const existingCategory = await this.getCategoryById(userId, categoryId);
      if (!existingCategory) {
        return null;
      }
      
      // Buscar la aplicación en la categoría
      const app = existingCategory.apps.find(app => app.id === appId);
      return app || null;
    } catch (error) {
      console.error(`[Postgres] Error al obtener aplicación ${appId}:`, error);
      throw error;
    }
  }
  
  /**
   * Crea una nueva aplicación en una categoría
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @param app - Datos de la aplicación a crear
   * @returns Promise con la aplicación creada incluyendo su ID
   */
  async createApp(userId: string, categoryId: string, app: Omit<FirebaseApp, 'id'>): Promise<FirebaseApp> {
    try {
      // Verificar que la categoría exista y pertenezca al usuario
      const existingCategory = await this.getCategoryById(userId, categoryId);
      if (!existingCategory) {
        throw new Error(`Categoría ${categoryId} no encontrada o no pertenece al usuario ${userId}`);
      }
      
      const appId = crypto.randomUUID();
      
      // Insertar la aplicación
      await db.execute(sql`
        INSERT INTO bms_apps (id, category_id, name, url, icon, description)
        VALUES (${appId}, ${categoryId}, ${app.name}, ${app.url}, ${app.icon}, ${app.description || null});
      `);
      
      return {
        id: appId,
        name: app.name,
        url: app.url,
        icon: app.icon,
        description: app.description,
      };
    } catch (error) {
      console.error(`[Postgres] Error al crear aplicación en categoría ${categoryId}:`, error);
      throw error;
    }
  }
  
  /**
   * Actualiza una aplicación existente
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @param appId - ID de la aplicación
   * @param app - Datos actualizados de la aplicación
   * @returns Promise con la aplicación actualizada
   */
  async updateApp(userId: string, categoryId: string, appId: string, app: Partial<FirebaseApp>): Promise<FirebaseApp> {
    try {
      // Verificar que la categoría exista y pertenezca al usuario
      const existingCategory = await this.getCategoryById(userId, categoryId);
      if (!existingCategory) {
        throw new Error(`Categoría ${categoryId} no encontrada o no pertenece al usuario ${userId}`);
      }
      
      // Verificar que la aplicación exista en la categoría
      const existingApp = existingCategory.apps.find(a => a.id === appId);
      if (!existingApp) {
        throw new Error(`Aplicación ${appId} no encontrada en categoría ${categoryId}`);
      }
      
      // Actualizar la aplicación
      const updates: string[] = [];
      const values: any[] = [];
      
      if (app.name !== undefined) {
        updates.push(`name = $${values.length + 1}`);
        values.push(app.name);
      }
      
      if (app.url !== undefined) {
        updates.push(`url = $${values.length + 1}`);
        values.push(app.url);
      }
      
      if (app.icon !== undefined) {
        updates.push(`icon = $${values.length + 1}`);
        values.push(app.icon);
      }
      
      if (app.description !== undefined) {
        updates.push(`description = $${values.length + 1}`);
        values.push(app.description);
      }
      
      if (updates.length > 0) {
        await db.execute(sql`
          UPDATE bms_apps
          SET ${sql.raw(updates.join(', '))}
          WHERE id = ${appId} AND category_id = ${categoryId};
        `);
      }
      
      // Obtener la aplicación actualizada
      const updatedApp = await this.getAppById(userId, categoryId, appId);
      if (!updatedApp) {
        throw new Error(`Aplicación ${appId} no encontrada después de actualizar`);
      }
      
      return updatedApp;
    } catch (error) {
      console.error(`[Postgres] Error al actualizar aplicación ${appId}:`, error);
      throw error;
    }
  }
  
  /**
   * Elimina una aplicación
   * @param userId - ID del usuario
   * @param categoryId - ID de la categoría
   * @param appId - ID de la aplicación
   * @returns Promise que se resuelve cuando la aplicación es eliminada
   */
  async deleteApp(userId: string, categoryId: string, appId: string): Promise<void> {
    try {
      // Verificar que la categoría exista y pertenezca al usuario
      const existingCategory = await this.getCategoryById(userId, categoryId);
      if (!existingCategory) {
        throw new Error(`Categoría ${categoryId} no encontrada o no pertenece al usuario ${userId}`);
      }
      
      // Verificar que la aplicación exista en la categoría
      const existingApp = existingCategory.apps.find(a => a.id === appId);
      if (!existingApp) {
        throw new Error(`Aplicación ${appId} no encontrada en categoría ${categoryId}`);
      }
      
      // Eliminar la aplicación
      await db.execute(sql`
        DELETE FROM bms_apps
        WHERE id = ${appId} AND category_id = ${categoryId};
      `);
    } catch (error) {
      console.error(`[Postgres] Error al eliminar aplicación ${appId}:`, error);
      throw error;
    }
  }
  
  /**
   * Marca o desmarca una aplicación como favorita
   * @param userId - ID del usuario
   * @param appId - ID de la aplicación
   * @param isFavorite - Indica si la aplicación es favorita o no
   * @returns Promise que se resuelve cuando la operación se completa
   */
  async toggleFavorite(userId: string, appId: string, isFavorite: boolean): Promise<void> {
    try {
      if (isFavorite) {
        // Verificar si ya es favorito
        const result = await db.execute(sql`
          SELECT 1 FROM bms_favorites
          WHERE user_id = ${userId} AND app_id = ${appId};
        `);
        
        if (result.rows.length === 0) {
          // No es favorito, añadirlo
          await db.execute(sql`
            INSERT INTO bms_favorites (user_id, app_id)
            VALUES (${userId}, ${appId});
          `);
        }
      } else {
        // Eliminar de favoritos
        await db.execute(sql`
          DELETE FROM bms_favorites
          WHERE user_id = ${userId} AND app_id = ${appId};
        `);
      }
    } catch (error) {
      console.error(`[Postgres] Error al ${isFavorite ? 'añadir' : 'quitar'} favorito ${appId}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtiene todas las aplicaciones favoritas de un usuario
   * @param userId - ID del usuario
   * @returns Promise con array de aplicaciones favoritas
   */
  async getFavorites(userId: string): Promise<FirebaseApp[]> {
    try {
      // Obtener favoritos con información de las aplicaciones
      const result = await db.execute(sql`
        SELECT a.id, a.name, a.url, a.icon, a.description
        FROM bms_favorites f
        JOIN bms_apps a ON f.app_id = a.id
        WHERE f.user_id = ${userId}
        ORDER BY f.timestamp DESC;
      `);
      
      const favorites: FirebaseApp[] = result.rows.map(row => ({
        id: String(row.id),
        name: String(row.name),
        url: String(row.url),
        icon: String(row.icon),
        description: row.description ? String(row.description) : undefined,
      }));
      
      return favorites;
    } catch (error) {
      console.error('[Postgres] Error al obtener favoritos:', error);
      throw error;
    }
  }
  
  /**
   * Verifica si una aplicación es favorita
   * @param userId - ID del usuario
   * @param appId - ID de la aplicación
   * @returns Promise con un booleano indicando si es favorita
   */
  async isFavorite(userId: string, appId: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT 1 FROM bms_favorites
        WHERE user_id = ${userId} AND app_id = ${appId};
      `);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error(`[Postgres] Error al verificar si ${appId} es favorito:`, error);
      throw error;
    }
  }
  
  /**
   * Registra un acceso a una aplicación
   * @param userId - ID del usuario
   * @param appId - ID de la aplicación
   * @returns Promise que se resuelve cuando el acceso es registrado
   */
  async recordAccess(userId: string, appId: string): Promise<void> {
    try {
      // Registrar acceso
      await db.execute(sql`
        INSERT INTO bms_access_history (user_id, app_id)
        VALUES (${userId}, ${appId});
      `);
    } catch (error) {
      console.error(`[Postgres] Error al registrar acceso a ${appId}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtiene las aplicaciones accedidas recientemente
   * @param userId - ID del usuario
   * @param limitCount - Número máximo de aplicaciones a devolver
   * @returns Promise con array de aplicaciones recientes
   */
  async getRecentApps(userId: string, limitCount: number = 10): Promise<FirebaseApp[]> {
    try {
      // Obtener accesos recientes con información de las aplicaciones
      const result = await db.execute(sql`
        SELECT DISTINCT ON (a.id) a.id, a.name, a.url, a.icon, a.description, MAX(h.timestamp) as last_access
        FROM bms_access_history h
        JOIN bms_apps a ON h.app_id = a.id
        WHERE h.user_id = ${userId}
        GROUP BY a.id, a.name, a.url, a.icon, a.description
        ORDER BY a.id, last_access DESC
        LIMIT ${limitCount};
      `);
      
      const recentApps: FirebaseApp[] = result.rows.map(row => ({
        id: String(row.id),
        name: String(row.name),
        url: String(row.url),
        icon: String(row.icon),
        description: row.description ? String(row.description) : undefined,
      }));
      
      return recentApps;
    } catch (error) {
      console.error('[Postgres] Error al obtener aplicaciones recientes:', error);
      throw error;
    }
  }
  
  /**
   * Busca aplicaciones por término de búsqueda
   * @param userId - ID del usuario
   * @param searchTerm - Término de búsqueda
   * @returns Promise con array de aplicaciones que coinciden con la búsqueda
   */
  async searchApps(userId: string, searchTerm: string): Promise<FirebaseApp[]> {
    try {
      // Buscar aplicaciones que coincidan con el término de búsqueda
      const result = await db.execute(sql`
        SELECT a.id, a.name, a.url, a.icon, a.description
        FROM bms_apps a
        JOIN bms_categories c ON a.category_id = c.id
        WHERE c.user_id = ${userId}
        AND (
          a.name ILIKE ${`%${searchTerm}%`} OR
          a.description ILIKE ${`%${searchTerm}%`}
        )
        ORDER BY a.name;
      `);
      
      const apps: FirebaseApp[] = result.rows.map(row => ({
        id: String(row.id),
        name: String(row.name),
        url: String(row.url),
        icon: String(row.icon),
        description: row.description ? String(row.description) : undefined,
      }));
      
      return apps;
    } catch (error) {
      console.error(`[Postgres] Error al buscar aplicaciones con término "${searchTerm}":`, error);
      throw error;
    }
  }
  
  /**
   * Obtiene la configuración global de la aplicación
   * @returns Promise con la configuración de la aplicación
   */
  async getAppConfig(): Promise<Record<string, any>> {
    try {
      const result = await db.execute(sql`
        SELECT value FROM bms_config
        WHERE key = 'appConfig';
      `);
      
      if (result.rows.length === 0) {
        // Si no existe, crear con valores predeterminados
        const defaultConfig = {
          showRegisterTab: true,
        };
        
        await db.execute(sql`
          INSERT INTO bms_config (key, value)
          VALUES ('appConfig', ${JSON.stringify(defaultConfig)}::jsonb);
        `);
        
        return defaultConfig;
      }
      
      // @ts-ignore - Postgres devuelve el valor como JSON
      return result.rows[0].value;
    } catch (error) {
      console.error('[Postgres] Error al obtener configuración de la aplicación:', error);
      throw error;
    }
  }
  
  /**
   * Actualiza la configuración global de la aplicación
   * @param config - Configuración parcial a actualizar
   * @returns Promise con la configuración actualizada
   */
  async updateAppConfig(config: Record<string, any>): Promise<Record<string, any>> {
    try {
      // Obtener configuración actual
      const currentConfig = await this.getAppConfig();
      
      // Combinar con la nueva configuración
      const newConfig = {
        ...currentConfig,
        ...config,
      };
      
      // Actualizar
      await db.execute(sql`
        UPDATE bms_config
        SET value = ${JSON.stringify(newConfig)}::jsonb
        WHERE key = 'appConfig';
      `);
      
      // Si no había filas actualizadas, insertar
      const updateResult = await db.execute(sql`SELECT count(*) as count FROM bms_config WHERE key = 'appConfig';`);
      if (updateResult.rows[0].count === '0') {
        await db.execute(sql`
          INSERT INTO bms_config (key, value)
          VALUES ('appConfig', ${JSON.stringify(newConfig)}::jsonb);
        `);
      }
      
      return newConfig;
    } catch (error) {
      console.error('[Postgres] Error al actualizar configuración de la aplicación:', error);
      throw error;
    }
  }
}