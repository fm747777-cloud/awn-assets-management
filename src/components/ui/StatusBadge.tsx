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
import { useLanguage } from '../../hooks/useLanguage.tsx';

const STATUS_ARABIC_MAP: Record<string, string> = {
  Assigned: 'مسند بالعهدة',
  Available: 'متاح بالمستودع',
  'Compliance Due': 'استحقاق امتثال',
  'In Maintenance': 'تحت الصيانة',
  Retired: 'مستبعد',
  Active: 'نشط',
  Inactive: 'غير نشط',
  Draft: 'مسودة',
  Compliant: 'متوافق',
  'Non-Compliant': 'غير متوافق',
  'Pending Inspection': 'بانتظار الفحص',
  'Under Review': 'قيد المراجعة',
  Approved: 'معتمد',
  Verified: 'تم التحقق',
  'Attention Required': 'متابعة عاجلة',
  CompliantMandate: 'اشتراط امتثال',
  'Standard Operational': 'تشغيلي قياسي',
  Standard: 'قياسي',
  Compliance: 'امتثال',
  'Non-Compliance': 'قياسي',
  Pending: 'قيد الانتظار',
  Completed: 'مكتمل',
  Inprogress: 'قيد التنفيذ',
  'In Progress': 'قيد التنفيذ',
  Rejected: 'مرفوض',
  Todo: 'للمتابعة',
  Deactivated: 'معطّل',
};

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
  const { isRtl } = useLanguage();
  const config = TONE_CONFIG[tone] || TONE_CONFIG.neutral;
  const Icon = config.icon;
  let displayLabel = label;
  if (isRtl) {
    if (STATUS_ARABIC_MAP[label]) {
      displayLabel = STATUS_ARABIC_MAP[label];
    } else if (label.startsWith('Status: ')) {
      const sub = label.slice(8);
      displayLabel = STATUS_ARABIC_MAP[sub] ? `الحالة: ${STATUS_ARABIC_MAP[sub]}` : `الحالة: ${sub}`;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border whitespace-nowrap shrink-0 ${config.classes} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{displayLabel}</span>
    </span>
  );
}
