import { commonEn } from './en/common.ts';
import { commonAr } from './ar/common.ts';
import { navigationEn } from './en/navigation.ts';
import { navigationAr } from './ar/navigation.ts';
import { dashboardEn } from './en/dashboard.ts';
import { dashboardAr } from './ar/dashboard.ts';
import { assetsEn } from './en/assets.ts';
import { assetsAr } from './ar/assets.ts';
import { notificationsEn } from './en/notifications.ts';
import { notificationsAr } from './ar/notifications.ts';
import { complianceAssetsEn } from './en/complianceAssets.ts';
import { complianceAssetsAr } from './ar/complianceAssets.ts';
import { nonComplianceAssetsEn } from './en/nonComplianceAssets.ts';
import { nonComplianceAssetsAr } from './ar/nonComplianceAssets.ts';
import { assetStatusEn } from './en/assetStatus.ts';
import { assetStatusAr } from './ar/assetStatus.ts';
import type { AppLanguage } from './types.ts';

export const translations = {
  en: {
    common: commonEn,
    navigation: navigationEn,
    dashboard: dashboardEn,
    assets: assetsEn,
    notifications: notificationsEn,
    complianceAssets: complianceAssetsEn,
    nonComplianceAssets: nonComplianceAssetsEn,
    assetStatus: assetStatusEn,
  },
  ar: {
    common: commonAr,
    navigation: navigationAr,
    dashboard: dashboardAr,
    assets: assetsAr,
    notifications: notificationsAr,
    complianceAssets: complianceAssetsAr,
    nonComplianceAssets: nonComplianceAssetsAr,
    assetStatus: assetStatusAr,
  },
} as const;

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const ENGLISH_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Format date in Saudi business standard format with strictly Latin digits
 * Examples:
 * Arabic: "15 يناير 2025"
 * English: "15 Jan 2025"
 */
export function formatLocalizedDate(dateInput: string | Date, language: AppLanguage): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) {
    // If it's a relative time like "10 min ago", "Yesterday", etc.
    if (typeof dateInput === 'string') {
      if (language === 'ar') {
        if (dateInput.includes('min ago')) {
          const num = dateInput.replace(/[^0-9]/g, '');
          return `منذ ${num} دقائق`;
        }
        if (dateInput.includes('h ago')) {
          const num = dateInput.replace(/[^0-9]/g, '');
          return `منذ ${num} ساعات`;
        }
        if (dateInput.includes('days ago')) {
          const num = dateInput.replace(/[^0-9]/g, '');
          return `منذ ${num} أيام`;
        }
        if (dateInput.toLowerCase() === 'yesterday') return 'أمس';
        if (dateInput.toLowerCase() === 'today') return 'اليوم';
      }
      return dateInput;
    }
    return '';
  }

  const day = d.getDate();
  const monthIdx = d.getMonth();
  const year = d.getFullYear();

  if (language === 'ar') {
    return `${day} ${ARABIC_MONTHS[monthIdx]} ${year}`;
  }
  return `${day} ${ENGLISH_MONTHS[monthIdx]} ${year}`;
}

/**
 * Ensures numbers remain Latin in both languages
 * E.g. 4500 -> "4,500"
 */
export function formatLocalizedNumber(num: number | string): string {
  if (num === null || num === undefined || num === '') return '';
  if (typeof num === 'number') {
    return num.toLocaleString('en-US');
  }
  return String(num);
}

export function translate(
  language: AppLanguage,
  key: string,
  params?: Record<string, string | number>
): string {
  const parts = key.split('.');
  const namespace = parts[0] as keyof typeof translations.en;
  const fullSubKey = parts.slice(1).join('.');
  const directSubKey = parts[1];

  const dict = translations[language] || translations.en;
  const nsDict = (dict as Record<string, any>)?.[namespace];
  const enNsDict = (translations.en as Record<string, any>)?.[namespace];

  let text = nsDict?.[fullSubKey] ?? nsDict?.[directSubKey] ?? enNsDict?.[fullSubKey] ?? enNsDict?.[directSubKey] ?? key;

  if (params && typeof text === 'string') {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }

  return text;
}
