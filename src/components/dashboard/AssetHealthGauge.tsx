import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, FileQuestion } from 'lucide-react';
import type { AssetHealthBreakdown } from '../../types/dashboard.ts';

export interface AssetHealthGaugeProps {
  health: AssetHealthBreakdown;
  language: 'en' | 'ar';
}

export function AssetHealthGauge({ health, language }: AssetHealthGaugeProps) {
  const isAr = language === 'ar';

  // SVG Radial calculation for 96%
  const size = 150;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (health.overallHealthyPercentage / 100) * circumference;

  return (
    <div className="bg-awn-surface border border-awn-border rounded-lg p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-awn-text-primary">
            {isAr ? 'سلامة الأصول والامتثال' : 'Asset Health'}
          </h2>
          <p className="text-xs text-awn-text-secondary">
            {isAr
              ? 'مؤشرات التوثيق النظامي وصلاحية التراخيص'
              : 'Statutory compliance & document validity posture'}
          </p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          {health.overallHealthyPercentage}% {isAr ? 'مطابق' : 'Healthy'}
        </span>
      </div>

      {/* Main Health Display & Breakdown */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto">
        {/* Radial Progress Gauge */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox={`0 0 ${size} ${size}`}
            aria-label={
              isAr
                ? `مؤشر سلامة الأصول: ${health.overallHealthyPercentage}% سليم`
                : `Asset health gauge: ${health.overallHealthyPercentage}% healthy`
            }
            role="img"
          >
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-awn-surface-alt"
            />
            {/* Progress Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#16A34A"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Central Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-bold font-mono tracking-tight text-awn-text-primary tabular-nums">
              {health.overallHealthyPercentage}%
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {isAr ? 'سليم ونظامي' : 'Healthy'}
            </span>
          </div>
        </div>

        {/* Detailed Status Breakdown */}
        <div className="flex-1 w-full space-y-2.5">
          {/* Valid */}
          <div className="p-2 rounded-md bg-awn-surface-alt/50 border border-awn-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium text-awn-text-primary">
                {isAr ? health.valid.labelAr : health.valid.label}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono tabular-nums">
              <span className="text-awn-text-muted text-[11px]">
                {health.valid.count.toLocaleString()}
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 w-9 text-right">
                {health.valid.percentage}%
              </span>
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="p-2 rounded-md bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-medium text-awn-text-primary">
                {isAr ? health.expiringSoon.labelAr : health.expiringSoon.label}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono tabular-nums">
              <span className="text-awn-text-muted text-[11px]">
                {health.expiringSoon.count.toLocaleString()}
              </span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 w-9 text-right">
                {health.expiringSoon.percentage}%
              </span>
            </div>
          </div>

          {/* Expired */}
          <div className="p-2 rounded-md bg-rose-500/5 border border-rose-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="font-medium text-awn-text-primary">
                {isAr ? health.expired.labelAr : health.expired.label}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono tabular-nums">
              <span className="text-awn-text-muted text-[11px]">
                {health.expired.count.toLocaleString()}
              </span>
              <span className="font-semibold text-rose-600 dark:text-rose-400 w-9 text-right">
                {health.expired.percentage}%
              </span>
            </div>
          </div>

          {/* Missing */}
          <div className="p-2 rounded-md bg-awn-surface-alt/30 border border-awn-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileQuestion className="w-3.5 h-3.5 text-awn-text-muted shrink-0" />
              <span className="font-medium text-awn-text-secondary">
                {isAr ? health.missing.labelAr : health.missing.label}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono tabular-nums">
              <span className="text-awn-text-muted text-[11px]">
                {health.missing.count}
              </span>
              <span className="font-semibold text-awn-text-muted w-9 text-right">
                {health.missing.percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
