import React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Info,
  ShieldAlert,
  X,
} from 'lucide-react';
import type { DashboardAlertItem } from '../../types/dashboard.ts';

export interface AssetAlertsSectionProps {
  alerts: DashboardAlertItem[];
  onDismissAlert: (id: string) => void;
  onResetAlerts: () => void;
  onNavigate: (path: string) => void;
  language: 'en' | 'ar';
}

export function AssetAlertsSection({
  alerts,
  onDismissAlert,
  onResetAlerts,
  onNavigate,
  language,
}: AssetAlertsSectionProps) {
  const isAr = language === 'ar';

  return (
    <div className="bg-awn-surface border border-awn-border rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-awn-text-primary">
            {isAr ? 'تنبيهات وتوجيهات الأصول' : 'Attention & Asset Alerts'}
          </h2>
          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-awn-surface-alt text-awn-text-secondary border border-awn-border font-mono tabular-nums">
            {alerts.length}
          </span>
        </div>

        {alerts.length === 0 ? (
          <button
            type="button"
            onClick={onResetAlerts}
            className="text-xs text-awn-text-muted hover:text-awn-primary transition-colors cursor-pointer"
          >
            {isAr ? 'إعادة ضبط التنبيهات' : 'Reset Alerts'}
          </button>
        ) : (
          <span className="text-xs text-awn-text-muted">
            {isAr ? 'إجراءات مطلوبة' : 'Action items requiring intervention'}
          </span>
        )}
      </div>

      {/* Alert Cards or Calm Empty State */}
      {alerts.length === 0 ? (
        <div className="py-8 px-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-awn-text-primary">
            {isAr ? 'جميع الأصول محدثة ومطابقة للنظام' : 'Everything is up to date'}
          </h3>
          <p className="text-xs text-awn-text-secondary mt-0.5 max-w-md">
            {isAr
              ? 'لا توجد أصول متأخرة أو وثائق منتهية تتطلب تدخلاً فورياً في الوقت الحالي.'
              : 'There are no expired mandates, unassigned depot backlogs, or urgent governance actions.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {alerts.map((alert) => {
            const isWarning = alert.tone === 'warning';
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border transition-all relative flex flex-col justify-between ${
                  isWarning
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-awn-surface-alt/40 border-awn-border'
                }`}
              >
                <div>
                  {/* Top Bar: Icon, Urgency, Target & Dismiss */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {isWarning ? (
                        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-awn-primary shrink-0" />
                      )}
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-awn-text-muted">
                        {alert.urgency === 'high'
                          ? isAr
                            ? 'أولوية عاجلة'
                            : 'High Priority'
                          : isAr
                          ? 'متابعة'
                          : 'Action Needed'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDismissAlert(alert.id)}
                      title={isAr ? 'إخفاء التنبيه' : 'Dismiss alert'}
                      aria-label={isAr ? 'إخفاء التنبيه' : 'Dismiss alert'}
                      className="p-1 rounded text-awn-text-muted hover:text-awn-text-primary hover:bg-awn-surface transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title & Target */}
                  <h3 className="text-xs font-semibold text-awn-text-primary leading-snug">
                    {isAr ? alert.titleAr : alert.title}
                  </h3>
                  <div className="text-[11px] font-mono font-medium text-awn-primary mt-0.5 truncate">
                    {alert.targetRef}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-awn-text-secondary mt-1.5 leading-relaxed">
                    {isAr ? alert.descriptionAr : alert.description}
                  </p>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-3 pt-2.5 border-t border-awn-border/60 flex items-center justify-between">
                  <span className="text-[10px] text-awn-text-muted font-mono">
                    {isAr ? 'نظام عَوْن' : 'AWN Core'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate(alert.actionPath)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-awn-surface border border-awn-border hover:bg-awn-surface-alt hover:text-awn-primary text-awn-text-primary transition-colors cursor-pointer"
                  >
                    <span>{isAr ? alert.actionLabelAr : alert.actionLabel}</span>
                    <ArrowUpRight className="w-3 h-3 text-awn-primary" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
