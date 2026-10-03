import React from 'react';
import { Menu, Moon, Sun, UserCheck } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import type { ResolvedRoute } from '../types/navigation.ts';
import { NotificationsMenu } from '../components/navigation/NotificationsMenu.tsx';

export interface HeaderProps {
  currentRoute: ResolvedRoute;
  onNavigate: (path: string) => void;
  onOpenMobileSidebar: () => void;
}

/**
 * Top Header
 * Includes:
 * - Page/context information (bilingual)
 * - Quick workspace navigation links
 * - Explicit two-option Language Switcher: [ EN ] | [ العربية ]
 * - Explicit two-option Appearance selector: [ ☀ Light ] [ ☾ Dark ]
 * - Notifications menu
 * - User area placeholder
 */
export function Header({
  currentRoute,
  onNavigate,
  onOpenMobileSidebar,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t, isRtl } = useLanguage();

  const activeLabel = isRtl
    ? currentRoute?.arabicLabel || currentRoute?.label || 'الأصول'
    : currentRoute?.label || 'Assets';

  const activeParentLabel = isRtl
    ? currentRoute?.parentArabicLabel || currentRoute?.parentLabel
    : currentRoute?.parentLabel;

  return (
    <header className="h-14 bg-awn-surface border-b border-awn-border px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Zone 1: Context & Mobile Trigger */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label={isRtl ? 'فتح القائمة الرئيسية' : 'Open navigation menu'}
          className="lg:hidden p-1.5 rounded-md text-awn-text-secondary hover:text-awn-text-primary hover:bg-awn-surface-alt cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
          <span className="font-semibold text-awn-text-primary truncate">
            {activeLabel}
          </span>
          {activeParentLabel && (
            <>
              <span className="text-awn-text-muted" aria-hidden="true">
                ·
              </span>
              <span className="text-xs text-awn-text-secondary hidden sm:inline truncate">
                {activeParentLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Quick Workspace Links */}
      <nav
        aria-label={t('navigation.quickJump')}
        className="hidden xl:flex items-center gap-5 text-xs font-medium text-awn-text-secondary"
      >
        <button
          type="button"
          onClick={() => onNavigate('/assets/dashboard')}
          className={`hover:text-awn-text-primary transition-colors whitespace-nowrap cursor-pointer ${
            currentRoute?.path === '/assets/dashboard' ? 'text-awn-primary font-semibold' : ''
          }`}
        >
          {t('navigation.dashboard')}
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/assets/requests')}
          className={`hover:text-awn-text-primary transition-colors whitespace-nowrap cursor-pointer ${
            currentRoute?.path === '/assets/requests' ? 'text-awn-primary font-semibold' : ''
          }`}
        >
          {t('navigation.requests')}
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/assets/registry')}
          className={`hover:text-awn-text-primary transition-colors whitespace-nowrap cursor-pointer ${
            currentRoute?.path === '/assets/registry' ? 'text-awn-primary font-semibold' : ''
          }`}
        >
          {t('navigation.assets')}
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/assets/master/categories')}
          className={`hover:text-awn-text-primary transition-colors whitespace-nowrap cursor-pointer ${
            currentRoute?.path?.startsWith('/assets/master') ? 'text-awn-primary font-semibold' : ''
          }`}
        >
          {t('navigation.master')}
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/assets/audit-trails')}
          className={`hover:text-awn-text-primary transition-colors whitespace-nowrap cursor-pointer ${
            currentRoute?.path === '/assets/audit-trails' ? 'text-awn-primary font-semibold' : ''
          }`}
        >
          {t('navigation.auditTrails')}
        </button>
      </nav>

      {/* Zone 3: Notifications, Language Switcher, Appearance Selector, User */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Notifications Control */}
        <NotificationsMenu onNavigate={onNavigate} />

        {/* Language Switcher: EN | العربية */}
        <div
          role="group"
          aria-label={t('common.language')}
          className="inline-flex items-center p-0.5 rounded-md bg-awn-surface-alt border border-awn-border"
        >
          <button
            type="button"
            onClick={() => setLanguage('en')}
            aria-pressed={language === 'en'}
            aria-label="Switch to English"
            title="English"
            className={`h-7 px-2 sm:px-2.5 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-awn-primary focus-visible:ring-offset-1 ${
              language === 'en'
                ? 'bg-awn-surface text-awn-primary font-semibold border border-awn-border shadow-xs'
                : 'text-awn-text-secondary hover:text-awn-text-primary border border-transparent'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ar')}
            aria-pressed={language === 'ar'}
            aria-label="التبديل إلى العربية"
            title="العربية"
            className={`h-7 px-2 sm:px-2.5 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-awn-primary focus-visible:ring-offset-1 ${
              language === 'ar'
                ? 'bg-awn-surface text-awn-primary font-semibold border border-awn-border shadow-xs'
                : 'text-awn-text-secondary hover:text-awn-text-primary border border-transparent'
            }`}
          >
            العربية
          </button>
        </div>

        {/* Explicit Two-Option Appearance Selector */}
        <div
          role="group"
          aria-label={t('common.appearance')}
          className="flex items-center gap-1.5"
        >
          <div className="inline-flex items-center p-0.5 rounded-md bg-awn-surface-alt border border-awn-border">
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
              aria-label={t('common.themeLight')}
              title={t('common.themeLight')}
              className={`inline-flex items-center gap-1.5 h-7 px-2 sm:px-2.5 rounded text-xs font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                theme === 'light'
                  ? 'bg-awn-surface text-awn-primary font-semibold border border-awn-border'
                  : 'text-awn-text-secondary hover:text-awn-text-primary border border-transparent'
              }`}
            >
              <Sun
                className={`w-3.5 h-3.5 shrink-0 ${
                  theme === 'light' ? 'text-awn-gold' : 'text-awn-text-muted'
                }`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{t('common.themeLight')}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
              aria-label={t('common.themeDark')}
              title={t('common.themeDark')}
              className={`inline-flex items-center gap-1.5 h-7 px-2 sm:px-2.5 rounded text-xs font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                theme === 'dark'
                  ? 'bg-awn-surface text-awn-primary font-semibold border border-awn-border'
                  : 'text-awn-text-secondary hover:text-awn-text-primary border border-transparent'
              }`}
            >
              <Moon
                className={`w-3.5 h-3.5 shrink-0 ${
                  theme === 'dark' ? 'text-awn-primary' : 'text-awn-text-muted'
                }`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{t('common.themeDark')}</span>
            </button>
          </div>
        </div>

        {/* Enterprise User Area Placeholder */}
        <div
          className="flex items-center gap-2 pl-2.5 rtl:pl-0 rtl:pr-2.5 border-l rtl:border-l-0 rtl:border-r border-awn-border"
          title={t('navigation.authenticatedSession')}
        >
          <div className="w-7 h-7 rounded-md bg-awn-primary-soft border border-awn-border text-awn-primary flex items-center justify-center text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <div className="hidden md:block text-left rtl:text-right leading-tight">
            <div className="text-xs font-semibold text-awn-text-primary">
              M. Al-Harbi
            </div>
            <div className="text-[11px] text-awn-text-muted">
              {t('navigation.assetGovernance')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
