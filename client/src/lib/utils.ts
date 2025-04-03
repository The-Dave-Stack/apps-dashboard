import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera URLs para posibles iconos/favicons basados en la URL de un sitio web
 * @param url URL del sitio web
 * @returns Un array de URLs de posibles iconos ordenados por probabilidad
 */
export function generateIconURLs(url: string): string[] {
  try {
    // Validar y normalizar la URL
    const urlObj = new URL(url);
    const { protocol, host } = urlObj;
    const origin = `${protocol}//${host}`;
    
    // Lista de posibles rutas de iconos, ordenadas por preferencia
    return [
      // 1. favicon.ico en la raíz (más común)
      `${origin}/favicon.ico`,
      
      // 2. favicon.png en la raíz
      `${origin}/favicon.png`,
      
      // 3. apple-touch-icon.png (usado en dispositivos iOS)
      `${origin}/apple-touch-icon.png`,
      
      // 4. icon.png en la raíz
      `${origin}/icon.png`,
      
      // 5. Logo basado en el nombre del dominio (usando Favicon Generator API)
      `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${origin}&size=32`,

      // 6. Servicio de Google Favicon como fallback final
      `https://www.google.com/s2/favicons?domain=${origin}&sz=32`
    ];
  } catch (error) {
    console.error("Error al generar URLs de iconos:", error);
    return [];
  }
}

/**
 * Icono por defecto para usar cuando no se encuentra ningún icono
 */
export const DEFAULT_ICON = "https://placehold.co/100x100?text=App";

/**
 * Verifica si una URL de imagen existe verificando si se puede cargar
 * @param url URL de la imagen a verificar
 * @returns Promise que se resuelve con true si la imagen existe y false si no
 */
export function checkImageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Intenta obtener el primer icono válido de una URL
 * @param url URL del sitio web
 * @returns Una promesa que resuelve con la URL del icono o el icono por defecto
 */
export async function getIconForUrl(url: string): Promise<string> {
  // Si la URL no es válida, devolver icono por defecto
  if (!url) return DEFAULT_ICON;
  
  try {
    // Generar posibles URLs de iconos
    const iconUrls = generateIconURLs(url);
    
    // Intentar cada URL en orden hasta encontrar una que funcione
    for (const iconUrl of iconUrls) {
      const exists = await checkImageExists(iconUrl);
      if (exists) {
        console.log(`[Icon Fetch] Icono encontrado en: ${iconUrl}`);
        return iconUrl;
      }
    }
    
    // Si ninguna URL funciona, devolver el icono por defecto
    console.log(`[Icon Fetch] No se encontró ningún icono para: ${url}`);
    return DEFAULT_ICON;
  } catch (error) {
    console.error(`[Icon Fetch] Error al obtener icono para ${url}:`, error);
    return DEFAULT_ICON;
  }
}
