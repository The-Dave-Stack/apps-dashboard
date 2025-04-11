/**
 * @fileoverview Supabase storage implementation for Bookmark Manager Sync
 * This module implements the IStorage interface using Supabase as backend.
 * @module storage/SupabaseStorage
 */

import { IStorage } from './IStorage';
import { FirebaseCategory, FirebaseApp, FirebaseUser, UserRole } from '@shared/schema';
import { createClient, SupabaseClient, User, AdminUserAttributes } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Storage implementation using Supabase
 * @class SupabaseStorage
 * @implements {IStorage}
 */
export class SupabaseStorage implements IStorage {
  private client: SupabaseClient;
  
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Environment variables SUPABASE_URL and SUPABASE_KEY are required to use SupabaseStorage');
    }
    
    this.client = createClient(supabaseUrl, supabaseKey);
    
    // Initialize the database if necessary
    this.initializeDatabase().catch(err => {
      console.error('[Supabase] Error initializing database:', err);
    });
  }
  
  /**
   * Initialize the database, creating necessary tables if they don't exist
   */
  private async initializeDatabase(): Promise<void> {
    try {
      console.log('[Supabase] Verifying database schema...');
      
      // Check if tables exist and create them if not
      // Note: Supabase allows table management through the web interface,
      // but we can also check and create programmatically if needed
      
      const { error: categoriesError } = await this.client
        .from('bms_categories')
        .select('id')
        .limit(1);
        
      if (categoriesError && categoriesError.code === '42P01') { // UNDEFINED_TABLE
        console.log('[Supabase] Creating categories table...');
        await this.client.rpc('create_bms_tables');
      }
    } catch (error) {
      console.error('[Supabase] Error initializing database:', error);
    }
  }
  
  /**
   * Gets all categories for a specific user
   * @param userId - User ID
   * @returns Promise with array of categories
   */
  async getCategories(userId: string): Promise<FirebaseCategory[]> {
    try {
      const { data, error } = await this.client
        .from('bms_categories')
        .select('*, bms_apps(*)')
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return data.map(category => ({
        id: category.id,
        name: category.name,
        apps: category.bms_apps.map((app: any) => ({
          id: app.id,
          name: app.name,
          url: app.url,
          icon: app.icon,
          description: app.description || ''
        }))
      }));
    } catch (error) {
      console.error(`[Supabase] Error getting categories for user ${userId}:`, error);
      return [];
    }
  }
  
  /**
   * Gets a specific category by its ID
   * @param userId - User ID
   * @param categoryId - Category ID
   * @returns Promise with the category or null if it doesn't exist
   */
  async getCategoryById(userId: string, categoryId: string): Promise<FirebaseCategory | null> {
    try {
      const { data, error } = await this.client
        .from('bms_categories')
        .select('*, bms_apps(*)')
        .eq('user_id', userId)
        .eq('id', categoryId)
        .single();
        
      if (error) return null;
      
      return {
        id: data.id,
        name: data.name,
        apps: data.bms_apps.map((app: any) => ({
          id: app.id,
          name: app.name,
          url: app.url,
          icon: app.icon,
          description: app.description || ''
        }))
      };
    } catch (error) {
      console.error(`[Supabase] Error getting category ${categoryId} for user ${userId}:`, error);
      return null;
    }
  }
  
  /**
   * Creates a new category
   * @param userId - User ID
   * @param category - Category data to create
   * @returns Promise with the created category including its ID
   */
  async createCategory(userId: string, category: Omit<FirebaseCategory, 'id'>): Promise<FirebaseCategory> {
    try {
      // Generate unique ID for the category
      const categoryId = crypto.randomUUID();
      
      const { data, error } = await this.client
        .from('bms_categories')
        .insert({
          id: categoryId,
          user_id: userId,
          name: category.name
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        apps: []
      };
    } catch (error) {
      console.error(`[Supabase] Error creating category for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Updates an existing category
   * @param userId - User ID
   * @param categoryId - Category ID
   * @param category - Updated category data
   * @returns Promise with the updated category
   */
  async updateCategory(userId: string, categoryId: string, category: Partial<FirebaseCategory>): Promise<FirebaseCategory> {
    try {
      const { data, error } = await this.client
        .from('bms_categories')
        .update({ name: category.name })
        .eq('user_id', userId)
        .eq('id', categoryId)
        .select('*, bms_apps(*)')
        .single();
        
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        apps: data.bms_apps.map((app: any) => ({
          id: app.id,
          name: app.name,
          url: app.url,
          icon: app.icon,
          description: app.description || ''
        }))
      };
    } catch (error) {
      console.error(`[Supabase] Error updating category ${categoryId} for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Deletes a category
   * @param userId - User ID
   * @param categoryId - Category ID
   * @returns Promise that resolves when the category is deleted
   */
  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    try {
      // Delete associated apps first
      await this.client
        .from('bms_apps')
        .delete()
        .eq('category_id', categoryId);
        
      // Then delete the category
      const { error } = await this.client
        .from('bms_categories')
        .delete()
        .eq('user_id', userId)
        .eq('id', categoryId);
        
      if (error) throw error;
    } catch (error) {
      console.error(`[Supabase] Error deleting category ${categoryId} for user ${userId}:`, error);
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
      // Primero verificamos que la categoría pertenezca al usuario
      const { data: categoryData, error: categoryError } = await this.client
        .from('bms_categories')
        .select('id')
        .eq('user_id', userId)
        .eq('id', categoryId)
        .single();
        
      if (categoryError) return [];
      
      // Luego obtenemos las aplicaciones
      const { data, error } = await this.client
        .from('bms_apps')
        .select('*')
        .eq('category_id', categoryId);
        
      if (error) throw error;
      
      return data.map(app => ({
        id: app.id,
        name: app.name,
        url: app.url,
        icon: app.icon,
        description: app.description || ''
      }));
    } catch (error) {
      console.error(`[Supabase] Error al obtener apps para categoría ${categoryId} y usuario ${userId}:`, error);
      return [];
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
      // Primero verificamos que la categoría pertenezca al usuario
      const { data: categoryData, error: categoryError } = await this.client
        .from('bms_categories')
        .select('id')
        .eq('user_id', userId)
        .eq('id', categoryId)
        .single();
        
      if (categoryError) return null;
      
      // Luego obtenemos la aplicación
      const { data, error } = await this.client
        .from('bms_apps')
        .select('*')
        .eq('category_id', categoryId)
        .eq('id', appId)
        .single();
        
      if (error) return null;
      
      return {
        id: data.id,
        name: data.name,
        url: data.url,
        icon: data.icon,
        description: data.description || ''
      };
    } catch (error) {
      console.error(`[Supabase] Error al obtener app ${appId} para categoría ${categoryId} y usuario ${userId}:`, error);
      return null;
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
      // Primero verificamos que la categoría pertenezca al usuario
      const { data: categoryData, error: categoryError } = await this.client
        .from('bms_categories')
        .select('id')
        .eq('user_id', userId)
        .eq('id', categoryId)
        .single();
        
      if (categoryError) throw new Error(`La categoría ${categoryId} no pertenece al usuario ${userId}`);
      
      // Generar ID único para la aplicación
      const appId = crypto.randomUUID();
      
      const { data, error } = await this.client
        .from('bms_apps')
        .insert({
          id: appId,
          category_id: categoryId,
          name: app.name,
          url: app.url,
          icon: app.icon || '',
          description: app.description || ''
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        url: data.url,
        icon: data.icon,
        description: data.description || ''
      };
    } catch (error) {
      console.error(`[Supabase] Error al crear app para categoría ${categoryId} y usuario ${userId}:`, error);
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
      // Primero verificamos que la categoría pertenezca al usuario
      const { data: categoryData, error: categoryError } = await this.client
        .from('bms_categories')
        .select('id')
        .eq('user_id', userId)
        .eq('id', categoryId)
        .single();
        
      if (categoryError) throw new Error(`La categoría ${categoryId} no pertenece al usuario ${userId}`);
      
      const { data, error } = await this.client
        .from('bms_apps')
        .update({
          name: app.name,
          url: app.url,
          icon: app.icon,
          description: app.description
        })
        .eq('category_id', categoryId)
        .eq('id', appId)
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        url: data.url,
        icon: data.icon,
        description: data.description || ''
      };
    } catch (error) {
      console.error(`[Supabase] Error al actualizar app ${appId} para categoría ${categoryId} y usuario ${userId}:`, error);
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
      // Primero verificamos que la categoría pertenezca al usuario
      const { data: categoryData, error: categoryError } = await this.client
        .from('bms_categories')
        .select('id')
        .eq('user_id', userId)
        .eq('id', categoryId)
        .single();
        
      if (categoryError) throw new Error(`La categoría ${categoryId} no pertenece al usuario ${userId}`);
      
      // Eliminar de favoritos primero
      await this.client
        .from('bms_favorites')
        .delete()
        .eq('app_id', appId);
        
      // Eliminar de accesos
      await this.client
        .from('bms_accesses')
        .delete()
        .eq('app_id', appId);
        
      // Luego eliminar la aplicación
      const { error } = await this.client
        .from('bms_apps')
        .delete()
        .eq('category_id', categoryId)
        .eq('id', appId);
        
      if (error) throw error;
    } catch (error) {
      console.error(`[Supabase] Error al eliminar app ${appId} para categoría ${categoryId} y usuario ${userId}:`, error);
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
        // Verificar si ya está en favoritos
        const { data: existingFav } = await this.client
          .from('bms_favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('app_id', appId)
          .single();
          
        if (!existingFav) {
          // Añadir a favoritos
          await this.client
            .from('bms_favorites')
            .insert({
              user_id: userId,
              app_id: appId,
              added_at: new Date().toISOString()
            });
        }
      } else {
        // Eliminar de favoritos
        await this.client
          .from('bms_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('app_id', appId);
      }
    } catch (error) {
      console.error(`[Supabase] Error al ${isFavorite ? 'marcar' : 'desmarcar'} app ${appId} como favorita para usuario ${userId}:`, error);
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
      const { data, error } = await this.client
        .from('bms_favorites')
        .select('app_id, bms_apps(*)')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });
        
      if (error) throw error;
      
      return data.map((fav: any) => ({
        id: fav.bms_apps.id,
        name: fav.bms_apps.name,
        url: fav.bms_apps.url,
        icon: fav.bms_apps.icon,
        description: fav.bms_apps.description || ''
      }));
    } catch (error) {
      console.error(`[Supabase] Error al obtener favoritos para usuario ${userId}:`, error);
      return [];
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
      const { data, error } = await this.client
        .from('bms_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('app_id', appId)
        .single();
        
      return !error && !!data;
    } catch (error) {
      console.error(`[Supabase] Error al verificar si app ${appId} es favorita para usuario ${userId}:`, error);
      return false;
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
      await this.client
        .from('bms_accesses')
        .insert({
          user_id: userId,
          app_id: appId,
          accessed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error(`[Supabase] Error al registrar acceso a app ${appId} para usuario ${userId}:`, error);
      // No propagamos el error para no interrumpir la experiencia del usuario
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
      const { data, error } = await this.client
        .from('bms_accesses')
        .select('app_id, bms_apps(*)')
        .eq('user_id', userId)
        .order('accessed_at', { ascending: false })
        .limit(limitCount);
        
      if (error) throw error;
      
      // Eliminar duplicados (manteniendo solo el acceso más reciente)
      const uniqueApps = new Map();
      data.forEach(access => {
        if (!uniqueApps.has(access.app_id)) {
          uniqueApps.set(access.app_id, access.bms_apps);
        }
      });
      
      return Array.from(uniqueApps.values()).map(app => ({
        id: app.id,
        name: app.name,
        url: app.url,
        icon: app.icon,
        description: app.description || ''
      }));
    } catch (error) {
      console.error(`[Supabase] Error al obtener apps recientes para usuario ${userId}:`, error);
      return [];
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
      // Obtener todas las categorías del usuario
      const { data: userCategories, error: categoriesError } = await this.client
        .from('bms_categories')
        .select('id')
        .eq('user_id', userId);
        
      if (categoriesError) throw categoriesError;
      
      const categoryIds = userCategories.map(cat => cat.id);
      
      if (categoryIds.length === 0) return [];
      
      // Buscar aplicaciones que coincidan con el término de búsqueda
      const { data, error } = await this.client
        .from('bms_apps')
        .select('*')
        .in('category_id', categoryIds)
        .or(`name.ilike.%${searchTerm}%,url.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        
      if (error) throw error;
      
      return data.map(app => ({
        id: app.id,
        name: app.name,
        url: app.url,
        icon: app.icon,
        description: app.description || ''
      }));
    } catch (error) {
      console.error(`[Supabase] Error al buscar apps para usuario ${userId} con término '${searchTerm}':`, error);
      return [];
    }
  }
  
  /**
   * Obtiene la configuración global de la aplicación
   * @returns Promise con la configuración de la aplicación
   */
  async getAppConfig(): Promise<Record<string, any>> {
    try {
      const { data, error } = await this.client
        .from('bms_config')
        .select('*')
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') { // No data returned
          // Crear configuración predeterminada
          const defaultConfig = { showRegisterTab: true };
          await this.updateAppConfig(defaultConfig);
          return defaultConfig;
        }
        throw error;
      }
      
      return data.config || {};
    } catch (error) {
      console.error('[Supabase] Error al obtener configuración global:', error);
      return { showRegisterTab: true }; // Configuración por defecto
    }
  }
  
  /**
   * Actualiza la configuración global de la aplicación
   * @param config - Configuración parcial a actualizar
   * @returns Promise con la configuración actualizada
   */
  async updateAppConfig(config: Record<string, any>): Promise<Record<string, any>> {
    try {
      // Verificar si existe la configuración
      const { data: existingConfig, error: getError } = await this.client
        .from('bms_config')
        .select('id')
        .single();
        
      if (getError && getError.code !== 'PGRST116') throw getError;
      
      if (!existingConfig) {
        // Crear nueva configuración
        const { data, error } = await this.client
          .from('bms_config')
          .insert({ config })
          .select()
          .single();
          
        if (error) throw error;
        
        return data.config;
      } else {
        // Actualizar configuración existente
        const { data, error } = await this.client
          .from('bms_config')
          .update({ config })
          .eq('id', existingConfig.id)
          .select()
          .single();
          
        if (error) throw error;
        
        return data.config;
      }
    } catch (error) {
      console.error('[Supabase] Error al actualizar configuración global:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene todos los usuarios registrados en el sistema
   * Este método utiliza la API de Supabase Auth
   * @returns Promise con array de usuarios
   */
  async getUsers(): Promise<FirebaseUser[]> {
    try {
      const { data: authUsers, error } = await this.client.auth.admin.listUsers();
      
      if (error) throw error;
      
      // Obtener roles personalizados desde la tabla de usuarios
      const { data: userRoles } = await this.client
        .from('bms_user_roles')
        .select('*');
        
      // Crear mapa de roles por userId
      const roleMap = new Map();
      if (userRoles) {
        userRoles.forEach(role => {
          roleMap.set(role.user_id, role.role);
        });
      }
      
      return authUsers.users.map(user => ({
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || '',
        email: user.email || '',
        role: roleMap.get(user.id) || UserRole.USER,
        createdAt: user.created_at,
        disabled: !user.confirmed_at
      }));
    } catch (error) {
      console.error('[Supabase] Error al obtener usuarios:', error);
      return [];
    }
  }
  
  /**
   * Obtiene un usuario específico por su ID
   * @param userId - ID del usuario
   * @returns Promise con el usuario o null si no existe
   */
  async getUserById(userId: string): Promise<FirebaseUser | null> {
    try {
      const { data, error } = await this.client.auth.admin.getUserById(userId);
      
      if (error || !data) return null;
      
      // Extraer el usuario del objeto data
      const user = data.user;
      
      // Obtener rol personalizado
      const { data: userRole } = await this.client
        .from('bms_user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
        
      return {
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || '',
        email: user.email || '',
        role: userRole?.role || UserRole.USER,
        createdAt: user.created_at,
        disabled: !user.email_confirmed_at
      };
    } catch (error) {
      console.error(`[Supabase] Error al obtener usuario ${userId}:`, error);
      return null;
    }
  }
  
  /**
   * Actualiza el rol de un usuario
   * @param userId - ID del usuario
   * @param role - Nuevo rol para el usuario
   * @returns Promise con el usuario actualizado
   */
  async updateUserRole(userId: string, role: UserRole): Promise<FirebaseUser> {
    try {
      // Verificar si el usuario existe
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error(`Usuario ${userId} no encontrado`);
      }
      
      // Verificar si ya existe un registro de rol para el usuario
      const { data: existingRole } = await this.client
        .from('bms_user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      if (existingRole) {
        // Actualizar rol existente
        await this.client
          .from('bms_user_roles')
          .update({ role })
          .eq('user_id', userId);
      } else {
        // Crear nuevo registro de rol
        await this.client
          .from('bms_user_roles')
          .insert({ user_id: userId, role });
      }
      
      // Devolver usuario actualizado
      return {
        ...user,
        role
      };
    } catch (error) {
      console.error(`[Supabase] Error al actualizar rol de usuario ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Activa o desactiva un usuario
   * @param userId - ID del usuario
   * @param disabled - Indica si el usuario debe ser desactivado
   * @returns Promise con el usuario actualizado
   */
  async toggleUserStatus(userId: string, disabled: boolean): Promise<FirebaseUser> {
    try {
      // Verificar si el usuario existe
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error(`Usuario ${userId} no encontrado`);
      }
      
      // Nota: Supabase no tiene una propiedad 'banned' directamente,
      // pero podemos usar el método para actualizar el usuario.
      // Dependiendo de la versión de Supabase, podríamos usar diferentes propiedades:
      // - 'banned'
      // - 'is_disabled'
      // - custom user_metadata
      
      if (disabled) {
        // Deshabilitar usuario
        await this.client.auth.admin.updateUserById(userId, {
          user_metadata: { disabled: true }
        });
      } else {
        // Habilitar usuario
        await this.client.auth.admin.updateUserById(userId, {
          user_metadata: { disabled: false }
        });
      }
      
      // Devolver usuario actualizado
      return {
        ...user,
        disabled
      };
    } catch (error) {
      console.error(`[Supabase] Error al ${disabled ? 'desactivar' : 'activar'} usuario ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Elimina un usuario
   * @param userId - ID del usuario
   * @returns Promise que se resuelve cuando el usuario es eliminado
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // Eliminar usuario de Supabase Auth
      await this.client.auth.admin.deleteUser(userId);
      
      // Eliminar rol personalizado
      await this.client
        .from('bms_user_roles')
        .delete()
        .eq('user_id', userId);
        
      // Eliminar datos del usuario (categorías, apps, favoritos, accesos)
      // Obtenemos las categorías del usuario
      const { data: categories } = await this.client
        .from('bms_categories')
        .select('id')
        .eq('user_id', userId);
        
      if (categories && categories.length > 0) {
        const categoryIds = categories.map(cat => cat.id);
        
        // Eliminar aplicaciones de estas categorías
        await this.client
          .from('bms_apps')
          .delete()
          .in('category_id', categoryIds);
      }
      
      // Eliminar favoritos
      await this.client
        .from('bms_favorites')
        .delete()
        .eq('user_id', userId);
        
      // Eliminar accesos
      await this.client
        .from('bms_accesses')
        .delete()
        .eq('user_id', userId);
        
      // Eliminar categorías
      await this.client
        .from('bms_categories')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.error(`[Supabase] Error al eliminar usuario ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Verifica si hay usuarios en el sistema
   * @returns Promise con un booleano indicando si hay usuarios
   */
  async hasUsers(): Promise<boolean> {
    try {
      const { data, error } = await this.client.auth.admin.listUsers({
        perPage: 1,
        page: 1
      });
      
      if (error) throw error;
      
      return data.users.length > 0;
    } catch (error) {
      console.error('[Supabase] Error al verificar existencia de usuarios:', error);
      throw error;
    }
  }
}