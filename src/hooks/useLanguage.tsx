import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '../store/useLanguageStore.ts';
import type { AppLanguage, LanguageContextValue } from '../i18n/types.ts';
import { formatLocalizedDate, formatLocalizedNumber, translate } from '../i18n/index.ts';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Language synchronization and DOM attributes are managed via useLanguageStore & i18next
  return <>{children}</>;
}

export function useLanguage(): LanguageContextValue {
  const language = useLanguageStore((state) => state.language);
  const isRtl = useLanguageStore((state) => state.isRtl);
  const dir = useLanguageStore((state) => state.dir);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const toggleLanguage = useLanguageStore((state) => state.toggleLanguage);

  const { t: i18nTranslate } = useTranslation();

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      // First try dictionary translate with namespace fallback, then i18next
      const direct = translate(language, key, params);
      if (direct && direct !== key) return direct;
      const fallback = i18nTranslate(key, params as any);
      return typeof fallback === 'string' ? fallback : key;
    },
    [language, i18nTranslate]
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

  return {
    language,
    isRtl,
    dir,
    setLanguage,
    toggleLanguage,
    t,
    formatDate,
    formatNumber,
  };
}
