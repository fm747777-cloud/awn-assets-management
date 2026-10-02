import React from 'react';
import { FolderSearch } from 'lucide-react';
import { Button } from './Button.tsx';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  primaryActionLabel?: string | null;
  onPrimaryAction?: (() => void) | null;
  secondaryActionLabel?: string | null;
  onSecondaryAction?: (() => void) | null;
}

export function EmptyState({
  icon = null,
  title = 'No records match the current criteria',
  description = 'Adjust your active filters or search query, or register a new record in this workspace.',
  primaryActionLabel = null,
  onPrimaryAction = null,
  secondaryActionLabel = null,
  onSecondaryAction = null,
}: EmptyStateProps) {
  return (
    <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
      <div className="w-11 h-11 rounded-lg bg-awn-surface-alt border border-awn-border flex items-center justify-center text-awn-primary mb-3.5">
        {icon || <FolderSearch className="w-5 h-5" aria-hidden="true" />}
      </div>
      <h3 className="text-sm font-semibold text-awn-text-primary">{title}</h3>
      <p className="text-xs text-awn-text-secondary max-w-md mt-1 leading-relaxed">
        {description}
      </p>
      {(primaryActionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {primaryActionLabel && onPrimaryAction && (
            <Button variant="primary" size="sm" onClick={onPrimaryAction}>
              {primaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
