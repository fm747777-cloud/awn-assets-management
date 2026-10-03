import React from 'react';
import {
  Calendar,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  DashboardFilterState,
  DashboardLocationFilter,
  DashboardScopeFilter,
  DashboardTimeRange,
} from '../../types/dashboard.ts';

export interface DashboardHeaderProps {
  filters: DashboardFilterState;
  onFilterChange: (nextFilters: Partial<DashboardFilterState>) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  language: 'en' | 'ar';
  onToggleLanguage?: () => void;
  lastUpdated?: string;
}

export function DashboardHeader({
  filters,
  onFilterChange,
  onRefresh,
  isRefreshing,
  language,
  lastUpdated,
}: DashboardHeaderProps) {
  const isAr = language === 'ar';

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
      {/* Title & Context */}
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-awn-text-primary">
            {isAr ? 'نظرة عامة على الأصول' : 'Assets Overview'}
          </h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#192A22]/10 text-[#192A22] dark:bg-[#BFAB93]/15 dark:text-[#BFAB93] border border-[#192A22]/20 dark:border-[#BFAB93]/30">
            {isAr ? 'مركز قيادة الأصول' : 'Asset Command Center'}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-awn-text-secondary max-w-2xl leading-relaxed">
          {isAr
            ? 'مراقبة توزيع الأصول، حالتها التشغيلية، مؤشرات الامتثال، والنشاط الأخير في مكان واحد.'
            : 'Monitor asset distribution, status, compliance, and recent activity in one place.'}
        </p>
      </div>

      {/* Lightweight Filter Controls & Language Switcher */}
      <div className="flex items-center flex-wrap gap-2 shrink-0">
        {/* Scope Filter */}
        <div className="relative inline-flex items-center">
          <label htmlFor="dashboard-scope-filter" className="sr-only">
            {isAr ? 'نطاق الأصول' : 'Asset Scope'}
          </label>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-awn-surface border border-awn-border text-xs text-awn-text-secondary hover:text-awn-text-primary transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-awn-text-muted shrink-0" />
            <select
              id="dashboard-scope-filter"
              value={filters.scope}
              onChange={(e) =>
                onFilterChange({ scope: e.target.value as DashboardScopeFilter })
              }
              className="bg-transparent text-xs font-medium text-awn-text-primary outline-hidden cursor-pointer pr-1"
            >
              <option value="ALL">{isAr ? 'جميع الأصول' : 'All Assets'}</option>
              <option value="COMPLIANCE">
                {isAr ? 'أصول الامتثال' : 'Compliance Assets'}
              </option>
              <option value="NON_COMPLIANCE">
                {isAr ? 'أصول بدون امتثال' : 'Non-Compliance'}
              </option>
            </select>
          </div>
        </div>

        {/* Location Filter */}
        <div className="relative inline-flex items-center">
          <label htmlFor="dashboard-location-filter" className="sr-only">
            {isAr ? 'الموقع' : 'Location'}
          </label>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-awn-surface border border-awn-border text-xs text-awn-text-secondary hover:text-awn-text-primary transition-colors">
            <MapPin className="w-3.5 h-3.5 text-awn-text-muted shrink-0" />
            <select
              id="dashboard-location-filter"
              value={filters.location}
              onChange={(e) =>
                onFilterChange({
                  location: e.target.value as DashboardLocationFilter,
                })
              }
              className="bg-transparent text-xs font-medium text-awn-text-primary outline-hidden cursor-pointer pr-1"
            >
              <option value="ALL">
                {isAr ? 'كافة المواقع' : 'All Locations'}
              </option>
              <option value="RIYADH">
                {isAr ? 'الرياض (المقر الرئيسي)' : 'Riyadh HQ'}
              </option>
              <option value="JEDDAH">
                {isAr ? 'فرع جدة' : 'Jeddah Branch'}
              </option>
              <option value="DAMMAM">
                {isAr ? 'مركز الدمام' : 'Dammam Hub'}
              </option>
              <option value="OTHER">
                {isAr ? 'مواقع أخرى' : 'Other Sites'}
              </option>
            </select>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="relative inline-flex items-center">
          <label htmlFor="dashboard-timerange-filter" className="sr-only">
            {isAr ? 'النطاق الزمني' : 'Time Range'}
          </label>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-awn-surface border border-awn-border text-xs text-awn-text-secondary hover:text-awn-text-primary transition-colors">
            <Calendar className="w-3.5 h-3.5 text-awn-text-muted shrink-0" />
            <select
              id="dashboard-timerange-filter"
              value={filters.timeRange}
              onChange={(e) =>
                onFilterChange({
                  timeRange: e.target.value as DashboardTimeRange,
                })
              }
              className="bg-transparent text-xs font-medium text-awn-text-primary outline-hidden cursor-pointer pr-1"
            >
              <option value="30D">
                {isAr ? 'آخر 30 يوماً' : 'Last 30 Days'}
              </option>
              <option value="7D">
                {isAr ? 'آخر 7 أيام' : 'Last 7 Days'}
              </option>
              <option value="90D">
                {isAr ? 'الربع الأخير (90 يوماً)' : 'Last 90 Days'}
              </option>
              <option value="YTD">
                {isAr ? 'منذ بداية العام (YTD)' : 'Year to Date'}
              </option>
            </select>
          </div>
        </div>

        {/* Refresh Action */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={isAr ? 'تحديث بيانات لوحة القيادة' : 'Refresh dashboard data'}
          title={
            lastUpdated
              ? `${isAr ? 'آخر تحديث' : 'Last updated'}: ${lastUpdated}`
              : isAr
              ? 'تحديث البيانات'
              : 'Refresh data'
          }
          className="p-1.5 rounded-md bg-awn-surface border border-awn-border text-awn-text-secondary hover:text-awn-text-primary hover:bg-awn-surface-alt transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#192A22] dark:text-[#BFAB93]' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
