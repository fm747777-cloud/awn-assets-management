import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AppLanguage, LanguageContextValue } from '../i18n/types.ts';
import { formatLocalizedDate, formatLocalizedNumber, translate } from '../i18n/index.ts';

const STORAGE_KEY = 'awn-language';

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  isRtl: false,
  dir: 'ltr',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string) => key,
  formatDate: (d: string) => d,
  formatNumber: (n: number | string) => String(n),
});

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') {
        return saved;
      }
    } catch {
      // Ignore storage access errors
    }
    return 'en';
  });

  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('dir', dir);
    root.setAttribute('lang', language);
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore storage write errors
    }
  }, [language, dir]);

  const setLanguage = useCallback((lang: AppLanguage) => {
    if (lang === 'en' || lang === 'ar') {
      setLanguageState(lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'ar' : 'en'));
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(language, key, params);
    },
    [language]
  );

  const formatDate = useCallback(
    (dateStr: string | Date) => {
      return formatLocalizedDate(dateStr, language);
    },
    [language]
  );

  const formatNumber = useCallback((val: number | string) => {
    return formatLocalizedNumber(val);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRtl,
        dir,
        setLanguage,
        toggleLanguage,
        t,
        formatDate,
        formatNumber,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
