import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '../../types/navigation.ts';

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
}

export function Breadcrumbs({ items = [], onNavigate }: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-awn-text-secondary">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onNavigate?.('/assets/registry')}
            className="text-awn-text-muted hover:text-awn-text-primary transition-colors font-medium cursor-pointer"
          >
            AWN (عَوْن)
          </button>
        </li>

        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-awn-text-muted shrink-0" aria-hidden="true" />
              {isLast ? (
                <span
                  aria-current="page"
                  className="font-semibold text-awn-text-primary"
                >
                  {crumb.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate?.(crumb.path)}
                  className="text-awn-text-secondary hover:text-awn-text-primary transition-colors cursor-pointer"
                >
                  {crumb.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
