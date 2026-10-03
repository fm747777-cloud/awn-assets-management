import React, { useState } from 'react';
import type { CategoryDistributionItem } from '../../types/dashboard.ts';

export interface AssetDistributionChartProps {
  distribution: CategoryDistributionItem[];
  language: 'en' | 'ar';
}

export function AssetDistributionChart({
  distribution,
  language,
}: AssetDistributionChartProps) {
  const isAr = language === 'ar';
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalCount = distribution.reduce((sum, item) => sum + item.count, 0);

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercentage = 0;

  const activeCategory = distribution.find((d) => d.id === hoveredId);

  return (
    <div className="bg-awn-surface border border-awn-border rounded-lg p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-awn-text-primary">
            {isAr ? 'توزيع الأصول حسب الفئات' : 'Asset Distribution'}
          </h2>
          <p className="text-xs text-awn-text-secondary">
            {isAr
              ? 'التصنيف المعتمد حسب فئات الأصول الرئيسية'
              : 'Categorization by primary master taxonomy'}
          </p>
        </div>
        <span className="text-xs font-mono text-awn-text-muted tabular-nums">
          {distribution.length} {isAr ? 'فئات' : 'Categories'}
        </span>
      </div>

      {/* Chart & Legend Grid */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto">
        {/* SVG Donut */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox={`0 0 ${size} ${size}`}
            aria-label={
              isAr
                ? 'مخطط دائري لتوزيع الأصول حسب الفئات'
                : 'Asset distribution donut chart'
            }
            role="img"
          >
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-awn-surface-alt"
            />

            {/* Slices */}
            {distribution.map((item) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
              cumulativePercentage += item.percentage;

              const isHovered = hoveredId === item.id;
              const hasHover = Boolean(hoveredId);

              return (
                <circle
                  key={item.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    opacity: hasHover && !isHovered ? 0.4 : 1,
                  }}
                />
              );
            })}
          </svg>

          {/* Donut Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
            <span className="text-xs text-awn-text-muted font-medium truncate max-w-[100px]">
              {activeCategory
                ? isAr
                  ? activeCategory.nameAr
                  : activeCategory.name
                : isAr
                ? 'إجمالي الأصول'
                : 'Total Assets'}
            </span>
            <span className="text-xl font-bold font-mono text-awn-text-primary tabular-nums tracking-tight">
              {activeCategory
                ? activeCategory.count.toLocaleString()
                : totalCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-awn-text-secondary font-mono tabular-nums">
              {activeCategory
                ? `${activeCategory.percentage.toFixed(1)}%`
                : isAr
                ? '100% المحفظة'
                : '100% Portfolio'}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-2">
          {distribution.map((item) => {
            const isHovered = hoveredId === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`p-1.5 rounded-md flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  isHovered ? 'bg-awn-surface-alt' : 'hover:bg-awn-surface-alt/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className={`truncate ${
                      isHovered
                        ? 'font-semibold text-awn-text-primary'
                        : 'text-awn-text-secondary'
                    }`}
                  >
                    {isAr ? item.nameAr : item.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                  <span className="text-awn-text-muted">
                    {item.count.toLocaleString()}
                  </span>
                  <span
                    className={`font-mono tabular-nums w-10 text-right ${
                      isHovered ? 'text-awn-text-primary font-bold' : 'text-awn-text-secondary font-medium'
                    }`}
                  >
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
