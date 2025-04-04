import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from './index';

// Definir los idiomas disponibles
export const availableLanguages = {
  es: 'Español',
  en: 'English'
};

type LanguageContextType = {
  language: string;
  changeLanguage: (lng: string) => void;
  availableLanguages: Record<string, string>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'es');

  // Función para cambiar el idioma
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Actualizar el estado cuando cambia el idioma
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLanguage(lng);
    };

    // Suscribirse al evento de cambio de idioma
    i18n.on('languageChanged', handleLanguageChanged);

    // Limpiar suscripción cuando se desmonta el componente
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage debe ser usado dentro de un LanguageProvider');
  }
  return context;
};

export default LanguageContext;