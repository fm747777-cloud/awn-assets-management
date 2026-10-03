import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button.tsx';
import type { ModalSize } from '../../types/ui.ts';

const SIZE_MAP: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer = null,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const maxWidthClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0"
            style={{ backgroundColor: 'var(--awn-backdrop)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`relative z-10 w-full ${maxWidthClass} bg-awn-surface border border-awn-border rounded-lg overflow-hidden`}
            style={{ boxShadow: 'var(--awn-shadow-overlay)' }}
          >
            <div className="px-5 py-4 border-b border-awn-border flex items-start justify-between gap-4">
              <div>
                <h2 id="modal-title" className="text-base font-semibold text-awn-text-primary">
                  {title}
                </h2>
                {description && (
                  <p className="text-xs text-awn-text-secondary mt-1">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1 rounded-md text-awn-text-muted hover:text-awn-text-primary hover:bg-awn-surface-alt cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>

            {footer && (
              <div className="px-5 py-3.5 bg-awn-surface-alt border-t border-awn-border flex items-center justify-end gap-2.5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  title?: string;
  description?: string;
  itemSummary?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Please confirm that you want to proceed with this operation.',
  itemSummary = null,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  children = null,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${
              variant === 'danger'
                ? 'bg-awn-error-soft text-awn-error border-awn-error-border'
                : 'bg-awn-warning-soft text-awn-warning border-awn-warning-border'
            }`}
          >
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="space-y-2 text-xs text-awn-text-secondary leading-relaxed flex-1">
            <p>{description}</p>
            {itemSummary && (
              <div className="p-2.5 rounded bg-awn-surface-alt border border-awn-border text-awn-text-primary font-medium">
                {itemSummary}
              </div>
            )}
          </div>
        </div>
        {children}
      </div>
    </Modal>
  );
}
