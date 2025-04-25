import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationES from './locales/es.json';
import translationEN from './locales/en.json';

// Translation resources
const resources = {
  es: {
    translation: translationES
  },
  en: {
    translation: translationEN
  }
};

// i18next configuration
i18n
  // Automatically detect language
  .use(LanguageDetector)
  // React integration
  .use(initReactI18next)
  // Initialize i18next
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