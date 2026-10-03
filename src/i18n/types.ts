export type AppLanguage = 'en' | 'ar';

export interface LanguageContextValue {
  language: AppLanguage;
  isRtl: boolean;
  dir: 'ltr' | 'rtl';
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (dateStr: string) => string;
  formatNumber: (val: number | string) => string;
}
