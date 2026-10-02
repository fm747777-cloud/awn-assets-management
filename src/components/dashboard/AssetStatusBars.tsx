import React from 'react';
import type { AssetStatusItem } from '../../types/dashboard.ts';

export interface AssetStatusBarsProps {
  statuses: AssetStatusItem[];
  language: 'en' | 'ar';
}

export function AssetStatusBars({ statuses, language }: AssetStatusBarsProps) {
  const isAr = language === 'ar';

  return (
    <div className="bg-awn-surface border border-awn-border rounded-lg p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-awn-text-primary">
            {isAr ? 'حالات الأصول التشغيلية' : 'Asset Status'}
          </h2>
          <p className="text-xs text-awn-text-secondary">
            {isAr
              ? 'توزيع الأصول حسب مراحل دورة الحياة التشغيلية'
              : 'Lifecycle status distribution across total portfolio'}
          </p>
        </div>
        <span className="text-xs font-mono text-awn-text-muted tabular-nums">
          {statuses.length} {isAr ? 'حالات' : 'States'}
        </span>
      </div>

      {/* Horizontal Bar List */}
      <div className="space-y-3.5 my-auto">
        {statuses.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.colorHex }}
                />
                <span className="font-medium text-awn-text-primary">
                  {isAr ? item.statusAr : item.status}
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono tabular-nums">
                <span className="text-awn-text-muted text-[11px]">
                  {item.count.toLocaleString()}
                </span>
                <span className="font-semibold text-awn-text-primary w-11 text-right">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Progress Bar Track & Fill */}
            <div
              className="h-2 w-full bg-awn-surface-alt rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={item.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${item.status}: ${item.percentage}%`}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.colorHex,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
