import React, { useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import type { SelectOption } from '../../types/common.ts';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: Array<string | SelectOption>;
  placeholder?: string;
  description?: string;
  error?: string;
}

export function Select({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  description,
  error,
  required = false,
  disabled = false,
  className = '',
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const descId = description ? `${selectId}-desc` : undefined;
  const errId = error ? `${selectId}-err` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
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
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={[descId, errId].filter(Boolean).join(' ') || undefined}
          className={`w-full h-9 appearance-none rounded-md bg-awn-surface pl-3 pr-9 rtl:pr-3 rtl:pl-9 text-sm text-awn-text-primary border transition-colors duration-150 cursor-pointer ${
            error
              ? 'border-awn-error focus:outline-awn-error'
              : 'border-awn-border hover:border-awn-border-strong'
          } disabled:bg-awn-surface-alt disabled:text-awn-text-muted disabled:cursor-not-allowed`}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const text = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={val} value={val}>
                {text}
              </option>
            );
          })}
        </select>

        <ChevronDown
          className="w-4 h-4 text-awn-text-muted pointer-events-none absolute right-3 rtl:right-auto rtl:left-3"
          aria-hidden="true"
        />
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
