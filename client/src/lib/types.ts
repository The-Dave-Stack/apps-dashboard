/**
 * @fileoverview Definición de tipos para Bookmark Manager Sync
 * Este archivo contiene las definiciones de interfaces y tipos utilizados en toda la aplicación.
 * @module lib/types
 */

/**
 * Interfaz que define la estructura de datos de una aplicación
 * @interface AppData
 * @property {string} [id] - Identificador único de la aplicación (opcional en creación)
 * @property {string} name - Nombre de la aplicación
 * @property {string} icon - URL del icono de la aplicación
 * @property {string} url - URL de destino al hacer clic en la aplicación
 * @property {string} [description] - Descripción opcional de la aplicación
 */
export interface AppData {
  id?: string;
  name: string;
  icon: string;
  url: string;
  description?: string;
}

/**
 * Interfaz que define la estructura de datos de una categoría
 * @interface CategoryData
 * @property {string} id - Identificador único de la categoría
 * @property {string} name - Nombre de la categoría
 * @property {AppData[]} apps - Lista de aplicaciones pertenecientes a la categoría
 */
export interface CategoryData {
  id: string;
  name: string;
  apps: AppData[];
}

/**
 * Enumeración que define los roles de usuario disponibles en la aplicación
 * @enum {string}
 */
export enum UserRole {
  /** Usuario estándar con permisos básicos */
  USER = "user",
  /** Usuario administrador con permisos completos */
  ADMIN = "admin"
}

/**
 * Interfaz que define la estructura de datos de un usuario
 * @interface UserData
 * @property {string} uid - Identificador único del usuario (proviene de Firebase Auth)
 * @property {string} email - Correo electrónico del usuario
 * @property {string} [displayName] - Nombre de visualización del usuario (opcional)
 * @property {string} [photoURL] - URL de la foto de perfil del usuario (opcional)
 * @property {UserRole} role - Rol del usuario en la aplicación
 */
export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
}
