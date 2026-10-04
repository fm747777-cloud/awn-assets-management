import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, RefreshCw } from 'lucide-react';
import { assetModuleService } from '../services/assetModuleService.ts';
import { useToast } from '../hooks/useToast.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { DataTable, dataTableFeatures } from '../components/table/DataTable.tsx';
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { Drawer } from '../components/ui/Drawer.tsx';
import { MetricStripSkeleton } from '../components/ui/LoadingState.tsx';
import type { WorkspaceDataResponse, WorkspaceRecordItem } from '../types/asset.ts';
import type { BreadcrumbItem, ResolvedRoute } from '../types/navigation.ts';

const SUB_NAVIGATION_GROUPS: Record<'assets' | 'master', BreadcrumbItem[]> = {
  assets: [
    { label: 'Assets Workspace', arabicLabel: 'سجل الأصول', path: '/assets/registry' },
    { label: 'Compliance Assets', arabicLabel: 'أصول الامتثال', path: '/assets/compliance' },
    { label: 'Non-Compliance Assets', arabicLabel: 'الأصول القياسية', path: '/assets/non-compliance' },
  ],
  master: [
    { label: 'Asset Categories', arabicLabel: 'تصنيفات الأصول', path: '/assets/master/categories' },
    { label: 'Asset Types', arabicLabel: 'أنواع الأصول', path: '/assets/master/types' },
    { label: 'Asset Tags', arabicLabel: 'وسوم الأصول', path: '/assets/master/tags' },
    { label: 'Asset Status', arabicLabel: 'حالات الأصول', path: '/assets/master/status' },
  ],
};

export interface WorkspacePlaceholderPageProps {
  currentRoute: ResolvedRoute;
  onNavigate: (path: string) => void;
}

export default function WorkspacePlaceholderPage({
  currentRoute,
  onNavigate,
}: WorkspacePlaceholderPageProps) {
  const { showToast } = useToast();
  const { isRtl } = useLanguage();

  const [workspaceData, setWorkspaceData] = useState<WorkspaceDataResponse>({
    workspaceId: 'dashboard',
    metrics: [],
    items: [],
    pagination: { page: 1, pageSize: 5, totalItems: 0, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<WorkspaceRecordItem | null>(null);

  const workspaceId = currentRoute?.id || 'dashboard';

  const loadWorkspace = useCallback(
    async (pageOverride = currentPage) => {
      setLoading(true);
      try {
        const result = await assetModuleService.getWorkspaceData(workspaceId, {
          search: searchQuery,
          statusFilter,
          page: pageOverride,
          pageSize: 5,
        });
        setWorkspaceData(result);
      } finally {
        setLoading(false);
      }
    },
    [workspaceId, searchQuery, statusFilter, currentPage]
  );

  useEffect(() => {
    setSelectedRecord(null);
    setCurrentPage(1);
  }, [workspaceId]);

  useEffect(() => {
    loadWorkspace(currentPage);
  }, [loadWorkspace, currentPage]);

  const subNavTabs =
    currentRoute?.path?.startsWith('/assets/master')
      ? SUB_NAVIGATION_GROUPS.master
      : ['/assets/compliance', '/assets/non-compliance'].includes(currentRoute?.path || '')
      ? SUB_NAVIGATION_GROUPS.assets
      : null;

  const statusFilterTabs = useMemo(
    () => [
      { id: 'ALL', label: isRtl ? 'كافة السجلات' : 'All Records' },
      { id: 'success', label: isRtl ? 'نشط / متوافق' : 'Active / Compliant' },
      { id: 'warning', label: isRtl ? 'متابعة / مستحق' : 'Attention / Due' },
      { id: 'info', label: isRtl ? 'متاح / مراجعة' : 'Available / Review' },
    ],
    [isRtl]
  );

  const columns = useMemo<ColumnDef<typeof dataTableFeatures, WorkspaceRecordItem>[]>(
    () => [
      {
        id: 'code',
        accessorKey: 'code',
        header: () => (isRtl ? 'رمز السجل' : 'Reference ID'),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setSelectedRecord(row.original)}
            className="font-mono text-xs font-semibold text-awn-primary hover:underline tabular-nums cursor-pointer"
          >
            {row.original.code}
          </button>
        ),
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: () => (isRtl ? 'اسم الأصل والسجل' : 'Record Designation'),
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-awn-text-primary leading-snug">
              {row.original.name}
            </div>
            <div className="text-xs text-awn-text-muted mt-0.5 flex items-center gap-1.5">
              <span>{row.original.classification}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{row.original.serialNumber}</span>
            </div>
          </div>
        ),
      },
      {
        id: 'categoryType',
        header: () => (isRtl ? 'التصنيف والنوع' : 'Category & Type'),
        cell: ({ row }) => (
          <div>
            <div className="text-xs font-medium text-awn-text-primary">
              {row.original.category}
            </div>
            <div className="text-xs text-awn-text-secondary mt-0.5">
              {row.original.type}
            </div>
          </div>
        ),
      },
      {
        id: 'locationCustodian',
        header: () => (isRtl ? 'الموقع وأمين العهدة' : 'Location & Custodian'),
        cell: ({ row }) => (
          <div>
            <div className="text-xs text-awn-text-primary">{row.original.location}</div>
            <div className="text-xs text-awn-text-secondary mt-0.5">
              {row.original.custodian}
            </div>
          </div>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: () => (isRtl ? 'الحالة' : 'Status'),
        cell: ({ row }) => (
          <StatusBadge label={row.original.status} tone={row.original.statusTone} />
        ),
      },
      {
        id: 'updatedAt',
        accessorKey: 'updatedAt',
        header: () => (
          <span className="block text-right rtl:text-left">
            {isRtl ? 'آخر تحديث' : 'Last Updated'}
          </span>
        ),
        cell: ({ row }) => (
          <span className="block font-mono text-xs text-awn-text-secondary tabular-nums text-right rtl:text-left">
            {row.original.updatedAt}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => (
          <span className="block text-right rtl:text-left">
            {isRtl ? 'الإجراءات' : 'Actions'}
          </span>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setSelectedRecord(row.original)}
              title={isRtl ? 'معاينة السجل' : 'Inspect details'}
              aria-label={`Inspect ${row.original.name}`}
              className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-surface border border-transparent hover:border-awn-border cursor-pointer transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [isRtl]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRtl ? currentRoute?.arabicLabel || currentRoute?.label || 'مساحة العمل' : currentRoute?.label || 'Workspace'}
        description={isRtl ? currentRoute?.arabicDescription || currentRoute?.description : currentRoute?.description}
        contextMeta={
          <span>
            {isRtl
              ? 'نقطة دخول مجهزة لمنظومة الأصول. سيتم ربط المسارات التشغيلية الكاملة لهذا القسم في المرحلة القادمة.'
              : currentRoute?.phaseNote || 'Workspace entry point prepared for upcoming module phase.'}
          </span>
        }
        secondaryActions={
          <Button
            variant="outline"
            size="md"
            leftIcon={isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            onClick={() => onNavigate('/assets/registry')}
          >
            {isRtl ? 'العودة إلى سجل الأصول' : 'Back to Assets Workspace'}
          </Button>
        }
      />

      {subNavTabs && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-awn-surface border border-awn-border rounded-lg p-2">
          <div className="flex flex-wrap items-center gap-1">
            {subNavTabs.map((tab) => {
              const isActive = currentRoute?.path === tab.path;
              return (
                <button
                  key={tab.path}
                  type="button"
                  onClick={() => onNavigate(tab.path)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-awn-primary text-awn-on-primary'
                      : 'text-awn-text-secondary hover:text-awn-text-primary hover:bg-awn-surface-alt'
                  }`}
                >
                  {isRtl ? tab.arabicLabel || tab.label : tab.label}
                </button>
              );
            })}
          </div>
          <span className="px-2 text-xs text-awn-text-muted hidden sm:inline">
            {isRtl ? 'التنقل المباشر بين الأقسام' : 'Entry Point Navigation'}
          </span>
        </div>
      )}

      {loading ? (
        <MetricStripSkeleton count={workspaceData.metrics.length || 2} />
      ) : (
        workspaceData.metrics.length > 0 && (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              workspaceData.metrics.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'
            } gap-4`}
          >
            {workspaceData.metrics.map((metric) => (
              <div
                key={metric.id}
                className="bg-awn-surface border border-awn-border rounded-lg p-4 flex flex-col justify-between"
              >
                <div className="text-xs font-medium text-awn-text-secondary">
                  {metric.label}
                </div>
                <div className="my-2 text-2xl font-semibold text-awn-text-primary font-mono tabular-nums">
                  {metric.value}
                </div>
                <div className="text-xs text-awn-text-muted flex items-center gap-1.5">
                  <span className="text-awn-primary font-medium">{metric.delta}</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{metric.context}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <DataTable
        title={isRtl ? `${currentRoute?.arabicLabel || currentRoute?.label} (معاينة السجلات)` : `${currentRoute?.label} Preview`}
        subtitle={isRtl ? 'نقطة دخول مجهزة لمنظومة الأصول. سيتم ربط المسارات التشغيلية الكاملة لهذا القسم في المرحلة القادمة.' : 'Prepared navigation entry point. Full business workflows for this sub-module will connect in the upcoming phase.'}
        columns={columns}
        data={workspaceData.items}
        count={workspaceData.pagination.totalItems}
        loading={loading}
        pageIndex={currentPage - 1}
        pageSize={5}
        onPageChange={(newPageIndex) => setCurrentPage(newPageIndex + 1)}
        searchValue={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        searchPlaceholder={isRtl ? 'البحث بالرمز، الاسم، أمين العهدة...' : 'Search code, name, custodian...'}
        toolbarSlot={
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label={isRtl ? 'تصفية السجلات حسب الحالة' : 'Filter records by status'}
              className="inline-flex flex-wrap items-center gap-1 p-1 rounded-md bg-awn-surface-alt border border-awn-border"
            >
              {statusFilterTabs.map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-awn-surface text-awn-primary border border-awn-border font-semibold'
                        : 'text-awn-text-secondary hover:text-awn-text-primary border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={async () => {
                await assetModuleService.resetWorkspaceData(workspaceId);
                setSearchQuery('');
                setStatusFilter('ALL');
                await loadWorkspace(1);
                showToast({
                  title: isRtl ? 'تم تحديث مساحة العمل' : 'Workspace refreshed',
                  description: `${currentRoute.label} records reloaded.`,
                  variant: 'info',
                });
              }}
            >
              {isRtl ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        }
      />

      <Drawer
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={selectedRecord ? `${selectedRecord.code} · Summary` : 'Record Summary'}
        subtitle="Contextual record preview."
        size="md"
        footer={
          <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
            Close Preview
          </Button>
        }
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-lg bg-awn-surface-alt border border-awn-border flex items-start justify-between gap-3">
              <div>
                <div className="font-mono font-semibold text-awn-primary tabular-nums">
                  {selectedRecord.code}
                </div>
                <div className="text-sm font-semibold text-awn-text-primary mt-0.5">
                  {selectedRecord.name}
                </div>
              </div>
              <StatusBadge label={selectedRecord.status} tone={selectedRecord.statusTone} />
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3 rounded border border-awn-border">
                <div className="text-awn-text-muted">Category & Type</div>
                <div className="font-medium text-awn-text-primary mt-0.5">
                  {selectedRecord.category} · {selectedRecord.type}
                </div>
              </div>
              <div className="p-3 rounded border border-awn-border">
                <div className="text-awn-text-muted">Location & Custodian</div>
                <div className="font-medium text-awn-text-primary mt-0.5">
                  {selectedRecord.location} · {selectedRecord.custodian}
                </div>
              </div>
              <div className="p-3 rounded border border-awn-border">
                <div className="text-awn-text-muted">Notes</div>
                <div className="text-awn-text-secondary mt-0.5 leading-relaxed">
                  {selectedRecord.notes}
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
