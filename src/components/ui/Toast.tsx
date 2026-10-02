import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react';
import type { ToastItem, ToastVariant } from '../../types/ui.ts';

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: LucideIcon; iconColor: string; borderClass: string }
> = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-awn-success',
    borderClass: 'border-l-4 border-l-awn-success',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-awn-warning',
    borderClass: 'border-l-4 border-l-awn-warning',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-awn-error',
    borderClass: 'border-l-4 border-l-awn-error',
  },
  info: {
    icon: Info,
    iconColor: 'text-awn-info',
    borderClass: 'border-l-4 border-l-awn-info',
  },
};

interface ToastContainerProps {
  toasts?: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts = [], onDismiss }: ToastContainerProps) {
  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => {
        const config = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.success;
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto bg-awn-surface border border-awn-border ${config.borderClass} rounded-md p-3.5 flex items-start gap-3`}
            style={{ boxShadow: 'var(--awn-shadow-overlay)' }}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${config.iconColor}`} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-awn-text-primary">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-awn-text-secondary mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="p-0.5 rounded text-awn-text-muted hover:text-awn-text-primary cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
