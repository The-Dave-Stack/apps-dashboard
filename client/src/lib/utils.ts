/**
 * @fileoverview Utilidades generales para la aplicación AppHub
 * Este módulo contiene funciones de utilidad para manejo de clases CSS, 
 * extracción y verificación de iconos de sitios web, y otras utilidades globales.
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina clases CSS con clsx y tailwind-merge para evitar conflictos
 * @param {...ClassValue[]} inputs - Las clases CSS a combinar
 * @returns {string} Cadena de texto con las clases combinadas y optimizadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera URLs para posibles iconos/favicons basados en la URL de un sitio web
 * Soporta múltiples formatos: PNG, JPG, SVG, ICO, GIF, WebP
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
    const possibleIcons = [
      // Favicon estándar (varios formatos)
      "/favicon.ico",
      "/favicon.png",
      "/favicon.svg",
      "/favicon.jpg",
      "/favicon.jpeg",
      "/favicon.gif",
      "/favicon.webp",
      
      // Iconos Apple (usados en dispositivos iOS, generalmente mejor calidad)
      "/apple-touch-icon.png",
      "/apple-touch-icon-precomposed.png",
      "/apple-touch-icon-180x180.png",
      "/apple-touch-icon-152x152.png",
      "/apple-touch-icon-120x120.png",
      
      // Iconos de aplicación web de Microsoft
      "/mstile-144x144.png",
      "/mstile-150x150.png",
      
      // Iconos genéricos  
      "/icon.png",
      "/icon.svg",
      "/icon.jpg",
      "/icon.ico",
      
      // Iconos en ubicaciones comunes
      "/assets/icon.png",
      "/assets/images/icon.png",
      "/images/icon.png",
      "/static/icon.png",
      "/static/favicon.png",
      "/img/favicon.png",
      "/img/icon.png",
      
      // PWA icons
      "/manifest-icon.png",
      "/pwa-icon.png",
      "/app-icon.png",
    ];
    
    // Generar URLs completas a partir de las rutas
    const iconUrls = possibleIcons.map(path => `${origin}${path}`);
    
    // Agregar servicios externos de iconos como respaldo
    return [
      ...iconUrls,
      
      // Logo basado en el nombre del dominio (usando Favicon Generator API)
      `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${origin}&size=64`,

      // Servicio de Google Favicon como fallback final (aumentado el tamaño)
      `https://www.google.com/s2/favicons?domain=${origin}&sz=64`
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
 * Incluye soporte para SVG y otros formatos no estándar
 * @param url URL de la imagen a verificar
 * @returns Promise que se resuelve con true si la imagen existe y false si no
 */
export function checkImageExists(url: string): Promise<boolean> {
  // Extraer la extensión del archivo de la URL
  const fileExtension = url.split('.').pop()?.toLowerCase();
  
  // Para SVGs podemos usar fetch en lugar de Image, ya que Image a veces no los maneja bien
  if (fileExtension === 'svg') {
    return new Promise((resolve) => {
      fetch(url, { method: 'HEAD', cache: 'no-cache' })
        .then(response => {
          // Si la respuesta es exitosa y el Content-Type es de tipo SVG
          if (response.ok && (
              response.headers.get('Content-Type')?.includes('svg') ||
              response.headers.get('Content-Type')?.includes('image')
            )) {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(() => resolve(false));
    });
  }
  
  // Para todos los demás formatos de imagen, usamos el método Image tradicional
  return new Promise((resolve) => {
    const img = new Image();
    
    // Establecer un timeout para evitar esperas largas en caso de conexiones lentas
    const timeout = setTimeout(() => {
      console.log(`[Icon Fetch] Timeout al verificar: ${url}`);
      resolve(false);
    }, 3000); // 3 segundos de timeout
    
    img.onload = () => {
      clearTimeout(timeout);
      // Verificar que la imagen tenga dimensiones válidas
      if (img.width > 0 && img.height > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    
    // Evitar problemas de caché
    img.src = url + (url.includes('?') ? '&' : '?') + 'cache=' + new Date().getTime();
  });
}

/**
 * Intenta extraer URLs de iconos desde el HTML de una página web
 * Busca en las etiquetas link y meta que suelen contener referencias a iconos
 * @param url URL del sitio web
 * @returns Promise con un array de URLs a posibles iconos encontrados en el HTML
 */
async function extractIconsFromHtml(url: string): Promise<string[]> {
  const iconLinks: string[] = [];
  
  try {
    // Establecer un timeout para la solicitud fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos máximo
    
    try {
      console.log(`[Icon Fetch] Intentando obtener HTML de: ${url}`);
      
      // Intentar obtener el HTML de la página
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 AppHub IconFetcher/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`[Icon Fetch] Error al obtener HTML: ${response.status} ${response.statusText}`);
        return iconLinks;
      }
      
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('text/html')) {
        console.log(`[Icon Fetch] El contenido no es HTML: ${contentType}`);
        return iconLinks;
      }
      
      // Parsear el HTML para extraer los iconos
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Buscar en etiquetas <link>
      const linkTags = doc.querySelectorAll<HTMLLinkElement>('link[rel*="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
      linkTags.forEach((link) => {
        const href = link.getAttribute('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, url).href;
            iconLinks.push(absoluteUrl);
          } catch (e) {
            // Ignorar URLs inválidas
          }
        }
      });
      
      // Buscar en etiquetas <meta>
      const metaTags = doc.querySelectorAll<HTMLMetaElement>('meta[property="og:image"], meta[name="msapplication-TileImage"], meta[name="twitter:image"]');
      metaTags.forEach((meta) => {
        const content = meta.getAttribute('content');
        if (content) {
          try {
            const absoluteUrl = new URL(content, url).href;
            iconLinks.push(absoluteUrl);
          } catch (e) {
            // Ignorar URLs inválidas
          }
        }
      });
      
      console.log(`[Icon Fetch] Iconos encontrados en HTML: ${iconLinks.length}`);
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.log(`[Icon Fetch] Error al procesar HTML: ${error}`);
    }
    
  } catch (error) {
    console.error(`[Icon Fetch] Error general al extraer iconos del HTML: ${error}`);
  }
  
  return iconLinks;
}

/**
 * Intenta obtener el primer icono válido de una URL
 * Utiliza múltiples métodos: URLs directas, extracción de HTML y servicios de fallback
 * @param url URL del sitio web
 * @returns Una promesa que resuelve con la URL del icono o el icono por defecto
 */
export async function getIconForUrl(url: string): Promise<string> {
  // Si la URL no es válida, devolver icono por defecto
  if (!url) return DEFAULT_ICON;
  
  try {
    console.log(`[Icon Fetch] Buscando icono para: ${url}`);
    
    // 1. Generar posibles URLs directas de iconos
    const iconUrls = generateIconURLs(url);
    
    // 2. Intentar cada URL directa
    for (const iconUrl of iconUrls) {
      const exists = await checkImageExists(iconUrl);
      if (exists) {
        console.log(`[Icon Fetch] Icono encontrado en URL directa: ${iconUrl}`);
        return iconUrl;
      }
    }
    
    // 3. Si no se encuentra ningún icono por URL directa, intentar extraer del HTML
    console.log(`[Icon Fetch] Intentando extraer iconos del HTML para: ${url}`);
    try {
      const htmlIcons = await extractIconsFromHtml(url);
      
      // 4. Verificar cada URL extraída del HTML
      for (const iconUrl of htmlIcons) {
        const exists = await checkImageExists(iconUrl);
        if (exists) {
          console.log(`[Icon Fetch] Icono encontrado en HTML: ${iconUrl}`);
          return iconUrl;
        }
      }
    } catch (htmlError) {
      console.error(`[Icon Fetch] Error al procesar HTML: ${htmlError}`);
    }
    
    // 5. Si todo lo anterior falla, usar el servicio de Google favicon como última opción
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
    console.log(`[Icon Fetch] Usando servicio de Google favicon: ${googleFaviconUrl}`);
    return googleFaviconUrl;
    
  } catch (error) {
    console.error(`[Icon Fetch] Error al obtener icono para ${url}:`, error);
    return DEFAULT_ICON;
  }
}
