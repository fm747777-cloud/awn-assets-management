import React from 'react';

export interface FormSectionProps {
  stepNumber?: string | null;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FormSection({
  stepNumber = null,
  title,
  description,
  children,
  columns = 2,
  className = '',
}: FormSectionProps) {
  return (
    <div
      className={`py-5 first:pt-0 last:pb-0 border-b border-awn-border last:border-b-0 ${className}`}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {stepNumber && (
            <span className="text-xs font-mono font-semibold text-awn-primary tabular-nums">
              {stepNumber}.
            </span>
          )}
          <h3 className="text-sm font-semibold text-awn-text-primary">{title}</h3>
        </div>
        {description && (
          <p className="text-xs text-awn-text-secondary mt-1 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>

      <div
        className={`grid grid-cols-1 ${
          columns === 2 ? 'sm:grid-cols-2' : columns === 3 ? 'sm:grid-cols-3' : ''
        } gap-4`}
      >
        {children}
      </div>
    </div>
  );
}
