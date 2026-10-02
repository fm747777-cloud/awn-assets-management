import React from 'react';
import { Loader2 } from 'lucide-react';
import type { ButtonSize, ButtonVariant } from '../../types/ui.ts';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-awn-primary text-awn-on-primary border border-transparent hover:bg-awn-primary-strong active:opacity-95',
  secondary:
    'bg-awn-primary-soft text-awn-primary border border-awn-border hover:border-awn-primary',
  outline:
    'bg-awn-surface text-awn-text-primary border border-awn-border hover:bg-awn-surface-alt hover:border-awn-border-strong',
  ghost:
    'bg-transparent text-awn-text-secondary border border-transparent hover:bg-awn-surface-alt hover:text-awn-text-primary',
  gold:
    'bg-awn-gold-soft text-awn-text-primary border border-awn-gold hover:opacity-90',
  danger:
    'bg-awn-error text-awn-on-primary border border-transparent hover:opacity-90',
  dangerOutline:
    'bg-awn-error-soft text-awn-error border border-awn-error-border hover:opacity-90',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-md',
  lg: 'h-10 px-5 text-sm gap-2 rounded-md',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ariaLabel?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  onClick,
  title,
  ariaLabel,
  ...rest
}: ButtonProps) {
  const variantStyle = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeStyle = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyle} ${sizeStyle} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0 inline-flex items-center">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span className="shrink-0 inline-flex items-center">{rightIcon}</span>
      )}
    </button>
  );
}
