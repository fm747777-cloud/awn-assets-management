import React from 'react';
import {
  Boxes,
  CheckCircle2,
  Layers,
  Package,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type { DashboardKpi } from '../../types/dashboard.ts';

export interface ExecutiveKpiStripProps {
  kpis: DashboardKpi[];
  language: 'en' | 'ar';
}

export function ExecutiveKpiStrip({ kpis, language }: ExecutiveKpiStripProps) {
  const isAr = language === 'ar';

  const renderIcon = (iconName: DashboardKpi['iconName'], tone?: DashboardKpi['tone']) => {
    const iconClass = 'w-4 h-4';
    switch (iconName) {
      case 'Boxes':
        return <Boxes className={`${iconClass} text-[#192A22] dark:text-[#BFAB93]`} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={`${iconClass} text-emerald-600 dark:text-emerald-400`} />;
      case 'UserCheck':
        return <UserCheck className={`${iconClass} text-sky-600 dark:text-sky-400`} />;
      case 'Layers':
        return <Layers className={`${iconClass} text-[#6A7358] dark:text-[#BFAB93]`} />;
      case 'ShieldCheck':
        return <ShieldCheck className={`${iconClass} text-amber-600 dark:text-amber-400`} />;
      case 'Package':
      default:
        return <Package className={`${iconClass} text-awn-text-secondary`} />;
    }
  };

  const getIconWrapperBg = (iconName: DashboardKpi['iconName'], tone?: DashboardKpi['tone']) => {
    if (iconName === 'Boxes') {
      return 'bg-[#192A22]/10 dark:bg-[#192A22]/40 border-[#192A22]/20 dark:border-[#BFAB93]/30';
    }
    if (iconName === 'Layers') {
      return 'bg-[#6A7358]/10 dark:bg-[#6A7358]/25 border-[#6A7358]/25 dark:border-[#BFAB93]/25';
    }
    switch (tone) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'info':
        return 'bg-sky-500/10 border-sky-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      default:
        return 'bg-awn-surface-alt border-awn-border';
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className="p-3.5 rounded-lg bg-awn-surface border border-awn-border hover:border-awn-border-strong hover:shadow-xs transition-all flex flex-col justify-between group"
        >
          {/* Header Row: Label & Icon */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-awn-text-secondary truncate">
              {isAr ? kpi.labelAr : kpi.label}
            </span>
            <div
              className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${getIconWrapperBg(
                kpi.iconName,
                kpi.tone
              )}`}
            >
              {renderIcon(kpi.iconName, kpi.tone)}
            </div>
          </div>

          {/* Metric Value */}
          <div className="my-2">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-awn-text-primary tabular-nums">
              {kpi.value}
            </div>
          </div>

          {/* Context / Subtext */}
          <div className="text-[11px] text-awn-text-muted truncate leading-tight">
            {isAr ? kpi.subtextAr : kpi.subtext}
          </div>
        </div>
      ))}
    </div>
  );
}
