import React from 'react';

export interface PageHeaderProps {
  title: React.ReactNode;
  arabicSubtitle?: string | null;
  description?: React.ReactNode;
  contextMeta?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}

export function PageHeader({
  title,
  arabicSubtitle = null,
  description,
  contextMeta = null,
  primaryAction = null,
  secondaryActions = null,
}: PageHeaderProps) {
  return (
    <div className="pb-5 border-b border-awn-border flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      <div className="space-y-1.5 max-w-3xl">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-awn-text-primary text-balance">
            {title}
          </h1>
          {arabicSubtitle && (
            <span className="text-xs text-awn-text-muted font-medium">
              · {arabicSubtitle}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-awn-text-secondary leading-relaxed">
            {description}
          </p>
        )}
        {contextMeta && (
          <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-awn-text-muted">
            {contextMeta}
          </div>
        )}
      </div>

      {(primaryAction || secondaryActions) && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
    </div>
  );
}
