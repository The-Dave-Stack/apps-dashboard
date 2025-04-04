/**
 * @fileoverview Servicio para gestionar el tema de la aplicación (claro/oscuro)
 * Este módulo proporciona funciones para establecer y gestionar el tema
 * de la aplicación, así como para sincronizarlo con el tema del sistema.
 * @module lib/theme-service
 */

/**
 * Tipo de tema soportado por la aplicación
 */
export type Theme = 'light' | 'dark';

/**
 * Clave para almacenar el tema en localStorage
 */
const THEME_STORAGE_KEY = 'apphub-theme';

/**
 * Clase de CSS que se aplica al elemento HTML para activar el tema oscuro
 */
const DARK_THEME_CLASS = 'dark';

/**
 * Obtiene el tema actual de la aplicación desde localStorage
 * 
 * @returns {Theme} El tema actual ('light' o 'dark')
 */
export function getTheme(): Theme {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }
  
  // Si no hay tema guardado, usar la preferencia del sistema
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Aplica el tema actual al documento
 * 
 * @param {Theme} theme - El tema a aplicar ('light' o 'dark')
 */
export function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add(DARK_THEME_CLASS);
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.classList.remove(DARK_THEME_CLASS);
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

/**
 * Guarda y aplica el tema especificado
 * 
 * @param {Theme} theme - El tema a establecer ('light' o 'dark')
 */
export function setTheme(theme: Theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

/**
 * Alterna entre los temas claro y oscuro
 * 
 * @returns {Theme} El nuevo tema establecido
 */
export function toggleTheme(): Theme {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
}

/**
 * Inicializa el tema cuando carga la aplicación
 * Aplica el tema guardado o el del sistema si no hay ninguno guardado
 */
export function initTheme() {
  // Obtener y aplicar el tema guardado
  const savedTheme = getTheme();
  applyTheme(savedTheme);
  
  // Escuchar cambios en las preferencias del sistema
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Función para manejar cambios en las preferencias del sistema
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    // Solo actualizar si el usuario no ha establecido una preferencia explícita
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  };
  
  // Añadir oyente para cambios en las preferencias del sistema
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  } else {
    // Para navegadores más antiguos
    mediaQuery.addListener(handleSystemThemeChange);
  }
}