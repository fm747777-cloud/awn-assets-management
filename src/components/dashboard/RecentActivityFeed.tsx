import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Laptop,
  PlusCircle,
  ShieldAlert,
  Tag,
  UserCheck,
} from 'lucide-react';
import type { ActivityType, RecentActivityItem } from '../../types/dashboard.ts';

export interface RecentActivityFeedProps {
  activities: RecentActivityItem[];
  onNavigate: (path: string) => void;
  language: 'en' | 'ar';
}

export function RecentActivityFeed({
  activities,
  onNavigate,
  language,
}: RecentActivityFeedProps) {
  const isAr = language === 'ar';

  const renderActivityIcon = (type: ActivityType, tone: RecentActivityItem['tone']) => {
    const iconClass = 'w-3.5 h-3.5';
    switch (type) {
      case 'ASSET_ADDED':
        return <PlusCircle className={`${iconClass} text-awn-primary`} />;
      case 'ASSET_ASSIGNED':
      case 'ASSET_REASSIGNED':
        return <UserCheck className={`${iconClass} text-sky-600 dark:text-sky-400`} />;
      case 'DOCUMENT_EXPIRING':
        return <ShieldAlert className={`${iconClass} text-amber-600 dark:text-amber-400`} />;
      case 'COMPLIANCE_VERIFIED':
        return <CheckCircle className={`${iconClass} text-emerald-600 dark:text-emerald-400`} />;
      case 'ASSET_UPDATED':
      default:
        return <Tag className={`${iconClass} text-awn-text-secondary`} />;
    }
  };

  const getToneBadgeStyle = (tone: RecentActivityItem['tone']) => {
    switch (tone) {
      case 'warning':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'success':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'info':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      default:
        return 'bg-awn-surface-alt text-awn-text-secondary border-awn-border';
    }
  };

  return (
    <div className="bg-awn-surface border border-awn-border rounded-lg p-5 flex flex-col justify-between">
      {/* Header with Quick Navigation to Audit Trails */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-awn-text-primary">
            {isAr ? 'النشاط الأخير للأصول' : 'Recent Asset Activity'}
          </h2>
          <p className="text-xs text-awn-text-secondary">
            {isAr
              ? 'سجل التغييرات المباشرة لحركة العهد والتراخيص والامتثال'
              : 'Chronological custody, registration, and status updates'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/assets/audit-trails')}
          className="inline-flex items-center gap-1 text-xs font-medium text-awn-primary hover:text-awn-primary-strong transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>{isAr ? 'عرض سجل التدقيق الكامل' : 'Full Audit Trail'}</span>
          <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Activity Timeline List */}
      <div className="divide-y divide-awn-border">
        {activities.map((item) => (
          <div
            key={item.id}
            className="py-3 first:pt-1 last:pb-1 flex items-start gap-3 group"
          >
            {/* Icon Anchor */}
            <div className="w-7 h-7 rounded-md bg-awn-surface-alt border border-awn-border flex items-center justify-center shrink-0 mt-0.5">
              {renderActivityIcon(item.type, item.tone)}
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getToneBadgeStyle(
                      item.tone
                    )}`}
                  >
                    {isAr ? item.typeLabelAr : item.typeLabel}
                  </span>
                  <span className="font-mono text-xs font-semibold text-awn-text-primary">
                    {item.assetCode}
                  </span>
                  <span className="text-awn-text-muted text-xs hidden sm:inline">
                    ·
                  </span>
                  <span className="text-xs text-awn-text-secondary truncate max-w-[280px]">
                    {isAr ? item.assetNameAr : item.assetName}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-awn-text-muted shrink-0 font-mono tabular-nums">
                  <Clock className="w-3 h-3 text-awn-text-muted" />
                  <span>{isAr ? item.relativeTimeAr : item.relativeTime}</span>
                </div>
              </div>

              <p className="text-xs text-awn-text-secondary mt-1 leading-relaxed">
                {isAr ? item.descriptionAr : item.description}
              </p>

              {item.linkPath && (
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={() => onNavigate(item.linkPath!)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-awn-primary hover:underline cursor-pointer"
                  >
                    <span>{isAr ? 'فحص السجل' : 'Inspect Record'}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
