import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { StatusTone } from '../../types/status.ts';

const TONE_CONFIG: Record<StatusTone, { icon: LucideIcon; classes: string }> = {
  success: {
    icon: CheckCircle2,
    classes: 'text-awn-success bg-awn-success-soft border-awn-success-border',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'text-awn-warning bg-awn-warning-soft border-awn-warning-border',
  },
  error: {
    icon: XCircle,
    classes: 'text-awn-error bg-awn-error-soft border-awn-error-border',
  },
  info: {
    icon: Info,
    classes: 'text-awn-info bg-awn-info-soft border-awn-info-border',
  },
  gold: {
    icon: Clock,
    classes: 'text-awn-gold-strong bg-awn-gold-soft border-awn-gold',
  },
  neutral: {
    icon: Info,
    classes: 'text-awn-text-secondary bg-awn-surface-alt border-awn-border',
  },
};

export interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  label,
  tone = 'neutral',
  showIcon = true,
  className = '',
}: StatusBadgeProps) {
  const config = TONE_CONFIG[tone] || TONE_CONFIG.neutral;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border whitespace-nowrap shrink-0 ${config.classes} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}
