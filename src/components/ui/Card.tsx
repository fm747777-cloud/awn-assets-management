import React from 'react';

export interface CardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

export function Card({
  title,
  description,
  actions = null,
  footer = null,
  children,
  noPadding = false,
  className = '',
}: CardProps) {
  return (
    <section
      className={`bg-awn-surface border border-awn-border rounded-lg overflow-hidden ${className}`}
    >
      {(title || description || actions) && (
        <div className="px-5 py-4 border-b border-awn-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-awn-text-primary">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-awn-text-secondary mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      <div className={noPadding ? '' : 'p-5'}>{children}</div>

      {footer && (
        <div className="px-5 py-3 bg-awn-surface-alt border-t border-awn-border flex items-center justify-between gap-3">
          {footer}
        </div>
      )}
    </section>
  );
}
