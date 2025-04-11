import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar archivos de traducción
import translationES from './locales/es.json';
import translationEN from './locales/en.json';

// Recursos de traducción
const resources = {
  es: {
    translation: translationES
  },
  en: {
    translation: translationEN
  }
};

// Configuración de i18next
i18n
  // Detectar idioma automáticamente
  .use(LanguageDetector)
  // Integración con React
  .use(initReactI18next)
  // Inicializar i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false // React already escapes content by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;