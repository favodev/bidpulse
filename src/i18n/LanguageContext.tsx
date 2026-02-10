"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { translations, Language, TranslationKeys } from "./translations";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "bidpulse-language";

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("es");
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar idioma del localStorage al montar
  useEffect(() => {
    const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (savedLang && (savedLang === "es" || savedLang === "en")) {
      setLanguageState(savedLang);
    }
    setIsHydrated(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, []);

  // Actualizar lang en el HTML cuando cambie
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.lang = language;
    }
  }, [language, isHydrated]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: translations[language],
  }), [language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
