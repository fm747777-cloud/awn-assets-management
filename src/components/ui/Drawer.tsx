import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguageStore } from '../../store/useLanguageStore.ts';
import type { DrawerSize } from '../../types/ui.ts';

const WIDTH_CLASSES: Record<DrawerSize, string> = {
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
};

export interface DrawerProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: DrawerSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'lg',
  children,
  footer = null,
}: DrawerProps) {
  const isRtl = useLanguageStore((state) => state.isRtl);

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

  const widthClass = WIDTH_CLASSES[size] || WIDTH_CLASSES.lg;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end rtl:justify-start"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0"
            style={{ backgroundColor: 'var(--awn-backdrop)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={{ x: isRtl ? -48 : 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isRtl ? -48 : 48, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative z-10 w-full ${widthClass} h-full bg-awn-surface border-l rtl:border-l-0 rtl:border-r border-awn-border flex flex-col`}
            style={{ boxShadow: 'var(--awn-shadow-overlay)' }}
          >
            <div className="px-6 py-4 border-b border-awn-border flex items-start justify-between gap-4 shrink-0">
              <div>
                <h2 id="drawer-title" className="text-base font-semibold text-awn-text-primary">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-awn-text-secondary mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="p-1.5 rounded-md text-awn-text-muted hover:text-awn-text-primary hover:bg-awn-surface-alt cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">{children}</div>

            {footer && (
              <div className="px-6 py-4 bg-awn-surface-alt border-t border-awn-border flex items-center justify-between gap-3 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
