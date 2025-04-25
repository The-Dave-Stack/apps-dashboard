import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from './index';

// Define available languages
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

  // Function to change language
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Update state when language changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLanguage(lng);
    };

    // Subscribe to language change event
    i18n.on('languageChanged', handleLanguageChanged);

    // Clean up subscription when component unmounts
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

// Custom hook to use the context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;