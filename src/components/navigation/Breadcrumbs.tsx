import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '../../types/navigation.ts';
import { useLanguage } from '../../hooks/useLanguage.tsx';

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
}

export function Breadcrumbs({ items = [], onNavigate }: BreadcrumbsProps) {
  const { isRtl } = useLanguage();
  if (!items.length) return null;

  return (
    <nav aria-label={isRtl ? 'مسار التنقل' : 'Breadcrumb'} className="flex items-center text-xs text-awn-text-secondary">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onNavigate?.('/assets/registry')}
            className="text-awn-text-muted hover:text-awn-text-primary transition-colors font-medium cursor-pointer"
          >
            {isRtl ? 'نظام عَوْن' : 'AWN (عَوْن)'}
          </button>
        </li>

        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;
          const crumbLabel = isRtl ? crumb.arabicLabel || crumb.label : crumb.label;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              <ChevronRight className={`w-3.5 h-3.5 text-awn-text-muted shrink-0 ${isRtl ? 'rotate-180' : ''}`} aria-hidden="true" />
              {isLast ? (
                <span
                  aria-current="page"
                  className="font-semibold text-awn-text-primary"
                >
                  {crumbLabel}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate?.(crumb.path)}
                  className="text-awn-text-secondary hover:text-awn-text-primary transition-colors cursor-pointer"
                >
                  {crumbLabel}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
