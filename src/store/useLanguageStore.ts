import { create } from 'zustand';
import i18n from '../i18n/index.ts';
import type { AppLanguage } from '../i18n/types.ts';

const LANGUAGE_STORAGE_KEY = 'awn-language';

function getInitialLanguage(): AppLanguage {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') {
      return saved;
    }
  } catch {
    // Restricted environment fallback
  }
  return 'en';
}

function applyLanguageToDocument(lang: AppLanguage) {
  if (typeof document === 'undefined') return;
  const isRtl = lang === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';
  const root = document.documentElement;
  root.setAttribute('dir', dir);
  root.setAttribute('lang', lang);
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Ignore storage write error
  }
  i18n.changeLanguage(lang);
}

interface LanguageState {
  language: AppLanguage;
  isRtl: boolean;
  dir: 'ltr' | 'rtl';
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
}

const initialLang = getInitialLanguage();
applyLanguageToDocument(initialLang);

export const useLanguageStore = create<LanguageState>((set) => ({
  language: initialLang,
  isRtl: initialLang === 'ar',
  dir: initialLang === 'ar' ? 'rtl' : 'ltr',
  setLanguage: (lang: AppLanguage) => {
    applyLanguageToDocument(lang);
    set({
      language: lang,
      isRtl: lang === 'ar',
      dir: lang === 'ar' ? 'rtl' : 'ltr',
    });
  },
  toggleLanguage: () => {
    set((state) => {
      const nextLang: AppLanguage = state.language === 'en' ? 'ar' : 'en';
      applyLanguageToDocument(nextLang);
      return {
        language: nextLang,
        isRtl: nextLang === 'ar',
        dir: nextLang === 'ar' ? 'rtl' : 'ltr',
      };
    });
  },
}));
