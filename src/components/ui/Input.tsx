import React, { useId } from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  onClear?: (() => void) | null;
}

export function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  description,
  error,
  required = false,
  disabled = false,
  leftIcon = null,
  rightSlot = null,
  onClear = null,
  className = '',
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const descId = description ? `${inputId}-desc` : undefined;
  const errId = error ? `${inputId}-err` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-awn-text-primary flex items-center gap-1"
        >
          <span>{label}</span>
          {required && (
            <span className="text-awn-error" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 rtl:left-auto rtl:right-3 text-awn-text-muted pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={[descId, errId].filter(Boolean).join(' ') || undefined}
          className={`w-full h-9 rounded-md bg-awn-surface text-sm text-awn-text-primary placeholder:text-awn-text-muted border transition-colors duration-150 ${
            leftIcon ? 'pl-9 rtl:pl-3 rtl:pr-9' : 'pl-3 rtl:pr-3'
          } ${onClear && value ? 'pr-8 rtl:pr-3 rtl:pl-8' : rightSlot ? 'pr-9 rtl:pr-3 rtl:pl-9' : 'pr-3 rtl:pl-3'} ${
            error
              ? 'border-awn-error focus:outline-awn-error'
              : 'border-awn-border hover:border-awn-border-strong'
          } disabled:bg-awn-surface-alt disabled:text-awn-text-muted disabled:cursor-not-allowed`}
          {...rest}
        />

        {onClear && value && !disabled && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear input"
            className="absolute right-2.5 rtl:right-auto rtl:left-2.5 text-awn-text-muted hover:text-awn-text-primary p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {!onClear && rightSlot && (
          <span className="absolute right-3 rtl:right-auto rtl:left-3 text-awn-text-muted flex items-center">
            {rightSlot}
          </span>
        )}
      </div>

      {description && !error && (
        <p id={descId} className="text-xs text-awn-text-secondary leading-relaxed">
          {description}
        </p>
      )}

      {error && (
        <p
          id={errId}
          role="alert"
          className="text-xs text-awn-error flex items-center gap-1.5 mt-0.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
}

export function Textarea({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  description,
  error,
  required = false,
  disabled = false,
  rows = 3,
  className = '',
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const descId = description ? `${inputId}-desc` : undefined;
  const errId = error ? `${inputId}-err` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-awn-text-primary flex items-center gap-1"
        >
          <span>{label}</span>
          {required && (
            <span className="text-awn-error" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      <textarea
        id={inputId}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={[descId, errId].filter(Boolean).join(' ') || undefined}
        className={`w-full rounded-md bg-awn-surface p-3 text-sm text-awn-text-primary placeholder:text-awn-text-muted border transition-colors duration-150 ${
          error
            ? 'border-awn-error focus:outline-awn-error'
            : 'border-awn-border hover:border-awn-border-strong'
        } disabled:bg-awn-surface-alt disabled:text-awn-text-muted disabled:cursor-not-allowed`}
        {...rest}
      />

      {description && !error && (
        <p id={descId} className="text-xs text-awn-text-secondary leading-relaxed">
          {description}
        </p>
      )}

      {error && (
        <p
          id={errId}
          role="alert"
          className="text-xs text-awn-error flex items-center gap-1.5 mt-0.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
