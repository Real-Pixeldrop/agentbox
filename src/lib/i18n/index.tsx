"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import en, { type Translations } from './en';
import fr from './fr';

type Language = 'EN' | 'FR';

interface I18nContextType {
  language: Language;
  t: Translations;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const dictionaries: Record<Language, Translations> = { EN: en, FR: fr };

const I18nContext = createContext<I18nContextType>({
  language: 'EN',
  t: en,
  toggleLanguage: () => {},
  setLanguage: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('FR');

  const toggleLanguage = useCallback(() => {
    setLanguageState(prev => prev === 'EN' ? 'FR' : 'EN');
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const value: I18nContextType = {
    language,
    t: dictionaries[language],
    toggleLanguage,
    setLanguage,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export type { Language, Translations };
