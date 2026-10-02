import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import type { LocationDistributionItem } from '../../types/dashboard.ts';

export interface AssetsByLocationBarsProps {
  locations: LocationDistributionItem[];
  language: 'en' | 'ar';
}

export function AssetsByLocationBars({
  locations,
  language,
}: AssetsByLocationBarsProps) {
  const isAr = language === 'ar';

  return (
    <div className="bg-awn-surface border border-awn-border rounded-lg p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-awn-text-primary">
            {isAr ? 'الأصول حسب المواقع' : 'Assets by Location'}
          </h2>
          <p className="text-xs text-awn-text-secondary">
            {isAr
              ? 'التوزيع الجغرافي للأصول عبر الفروع والمستودعات'
              : 'Regional footprint across corporate hubs & facilities'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-mono text-awn-text-muted tabular-nums">
          <MapPin className="w-3.5 h-3.5 text-awn-gold" />
          <span>
            {locations.length} {isAr ? 'مراكز' : 'Hubs'}
          </span>
        </span>
      </div>

      {/* Location Bars List */}
      <div className="space-y-3.5 my-auto">
        {locations.map((loc) => (
          <div key={loc.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-awn-text-muted shrink-0" />
                <div className="truncate">
                  <span className="font-semibold text-awn-text-primary">
                    {isAr ? loc.locationAr : loc.location}
                  </span>
                  <span className="text-[11px] text-awn-text-muted ml-1.5 hidden sm:inline">
                    · {isAr ? loc.subLocationAr : loc.subLocation}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
                <span className="text-awn-text-muted text-[11px]">
                  {loc.count.toLocaleString()}
                </span>
                <span className="font-semibold text-awn-text-primary w-11 text-right">
                  {loc.percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Progress Bar Track & Fill */}
            <div
              className="h-2 w-full bg-awn-surface-alt rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={loc.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${loc.location}: ${loc.percentage}%`}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${loc.percentage}%`,
                  backgroundColor: loc.colorHex,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
