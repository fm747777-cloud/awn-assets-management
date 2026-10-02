import React, { useCallback, useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService.ts';
import type { DashboardDataResponse, DashboardFilterState } from '../types/dashboard.ts';
import { DashboardHeader } from '../components/dashboard/DashboardHeader.tsx';
import { ExecutiveKpiStrip } from '../components/dashboard/ExecutiveKpiStrip.tsx';
import { AssetDistributionChart } from '../components/dashboard/AssetDistributionChart.tsx';
import { AssetHealthGauge } from '../components/dashboard/AssetHealthGauge.tsx';
import { AssetStatusBars } from '../components/dashboard/AssetStatusBars.tsx';
import { AssetsByLocationBars } from '../components/dashboard/AssetsByLocationBars.tsx';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed.tsx';
import { AssetAlertsSection } from '../components/dashboard/AssetAlertsSection.tsx';
import { MetricStripSkeleton, TableSkeleton } from '../components/ui/LoadingState.tsx';

export interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [filters, setFilters] = useState<DashboardFilterState>({
    scope: 'ALL',
    location: 'ALL',
    timeRange: '30D',
  });

  const [data, setData] = useState<DashboardDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  const loadData = useCallback(async (currentFilters: DashboardFilterState, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const response = await dashboardService.getDashboardData(currentFilters);
      setData(response);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  const handleFilterChange = (nextFilters: Partial<DashboardFilterState>) => {
    setFilters((prev) => ({ ...prev, ...nextFilters }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(filters, true);
  };

  const handleDismissAlert = (id: string) => {
    dashboardService.dismissAlert(id);
    setData((prev) => (prev ? { ...prev, alerts: prev.alerts.filter((a) => a.id !== id) } : null));
  };

  const handleResetAlerts = () => {
    dashboardService.resetAlerts();
    loadData(filters, true);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-5 animate-pulse" aria-label="Loading dashboard analytics">
        <div className="h-10 bg-awn-surface border border-awn-border rounded-lg w-1/3" />
        <MetricStripSkeleton count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 bg-awn-surface border border-awn-border rounded-lg" />
          <div className="h-64 bg-awn-surface border border-awn-border rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 bg-awn-surface border border-awn-border rounded-lg" />
          <div className="h-64 bg-awn-surface border border-awn-border rounded-lg" />
        </div>
        <div className="bg-awn-surface border border-awn-border rounded-lg p-4">
          <TableSkeleton rows={4} columns={4} />
        </div>
      </div>
    );
  }

  const isRtl = language === 'ar';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`space-y-5 ${isRtl ? 'font-sans' : ''}`}
      aria-label={isRtl ? 'مركز قيادة الأصول - لوحة المراقبة' : 'Asset Command Center Dashboard'}
    >
      {/* 1. Header with Filters & Language Switcher */}
      <DashboardHeader
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        language={language}
        onToggleLanguage={toggleLanguage}
        lastUpdated={data.lastUpdated}
      />

      {/* 2. Executive KPI Strip (6 Key Metrics) */}
      <ExecutiveKpiStrip kpis={data.kpis} language={language} />

      {/* 3. Asset Distribution (Donut) & Asset Health (Radial Gauge) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AssetDistributionChart distribution={data.distribution} language={language} />
        <AssetHealthGauge health={data.health} language={language} />
      </div>

      {/* 4. Asset Status (Horizontal Bars) & Assets by Location (Horizontal Bars) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AssetStatusBars statuses={data.statuses} language={language} />
        <AssetsByLocationBars locations={data.locations} language={language} />
      </div>

      {/* 5. Recent Asset Activity Timeline */}
      <RecentActivityFeed
        activities={data.recentActivities}
        onNavigate={onNavigate}
        language={language}
      />

      {/* 6. Attention & Asset Alerts Area */}
      <AssetAlertsSection
        alerts={data.alerts}
        onDismissAlert={handleDismissAlert}
        onResetAlerts={handleResetAlerts}
        onNavigate={onNavigate}
        language={language}
      />
    </div>
  );
}
