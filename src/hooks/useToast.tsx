import React, { useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import { useLanguageStore } from '../store/useLanguageStore.ts';
import { useThemeStore } from '../store/useThemeStore.ts';
import type { ToastContextValue, ToastInput } from '../types/ui.ts';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const dir = useLanguageStore((state) => state.dir);
  const theme = useThemeStore((state) => state.theme);

  return (
    <>
      {children}
      <Toaster
        richColors
        position="top-right"
        dir={dir}
        theme={theme}
        toastOptions={{
          className: 'awn-sonner-toast font-sans text-xs',
        }}
      />
    </>
  );
}

export function useToast(): ToastContextValue {
  const showToast = useCallback(
    ({ title, description, variant = 'success', duration = 4000 }: ToastInput) => {
      const opts = {
        description,
        duration,
      };

      switch (variant) {
        case 'success':
          toast.success(title, opts);
          break;
        case 'error':
          toast.error(title, opts);
          break;
        case 'warning':
          toast.warning(title, opts);
          break;
        case 'info':
          toast.info(title, opts);
          break;
        default:
          toast(title, opts);
      }
    },
    []
  );

  const dismissToast = useCallback((id?: string) => {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  }, []);

  return {
    showToast,
    dismissToast,
  };
}
