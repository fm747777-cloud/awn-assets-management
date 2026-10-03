import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { Input } from './Input.tsx';
import { Button } from './Button.tsx';
import { StatusBadge } from './StatusBadge.tsx';
import { EmptyState } from './EmptyState.tsx';
import { TableSkeleton } from './LoadingState.tsx';
import type { WorkspaceRecordItem } from '../../types/asset.ts';
import type { PaginationState } from '../../types/common.ts';
import type { TableFilterTab } from '../../types/ui.ts';
import { useLanguage } from '../../hooks/useLanguage.tsx';

const STATUS_FILTERS: TableFilterTab[] = [
  { id: 'ALL', label: 'All Records' },
  { id: 'success', label: 'Active / Compliant' },
  { id: 'warning', label: 'Attention / Due' },
  { id: 'info', label: 'Available / Review' },
];

export interface DataTableProps<TRow extends WorkspaceRecordItem = WorkspaceRecordItem> {
  title?: string;
  subtitle?: string;
  items?: TRow[];
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  pagination?: PaginationState;
  onPageChange?: (nextPage: number) => void;
  onViewRow?: (row: TRow) => void;
  onEditRow?: (row: TRow) => void;
  onDeleteRow?: (row: TRow) => void;
  onCreateNew?: (() => void) | null;
  createLabel?: string;
  toolbarSlot?: React.ReactNode;
}

export function DataTable<TRow extends WorkspaceRecordItem = WorkspaceRecordItem>({
  title,
  subtitle,
  items = [],
  loading = false,
  searchQuery = '',
  onSearchChange,
  statusFilter = 'ALL',
  onStatusFilterChange,
  pagination = { page: 1, pageSize: 5, totalItems: 0, totalPages: 1 },
  onPageChange,
  onViewRow,
  onEditRow,
  onDeleteRow,
  onCreateNew = null,
  createLabel = 'Register Record',
  toolbarSlot = null,
}: DataTableProps<TRow>) {
  const { isRtl, formatNumber } = useLanguage();

  const statusFilterTabs: TableFilterTab[] = [
    { id: 'ALL', label: isRtl ? 'كافة السجلات' : 'All Records' },
    { id: 'success', label: isRtl ? 'نشط / متوافق' : 'Active / Compliant' },
    { id: 'warning', label: isRtl ? 'متابعة / مستحق' : 'Attention / Due' },
    { id: 'info', label: isRtl ? 'متاح / مراجعة' : 'Available / Review' },
  ];

  return (
    <div className="bg-awn-surface border border-awn-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-awn-border space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-awn-text-primary">{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs text-awn-text-secondary mt-0.5">{subtitle}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-64">
              <Input
                placeholder={isRtl ? 'البحث بالرمز، الاسم، أمين العهدة...' : 'Search code, name, custodian...'}
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onClear={() => onSearchChange?.('')}
                leftIcon={<Search className="w-3.5 h-3.5" />}
                aria-label={isRtl ? 'بحث في السجلات' : 'Search records'}
              />
            </div>
            {toolbarSlot}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
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
                  onClick={() => onStatusFilterChange?.(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-awn-surface text-awn-primary border border-awn-border'
                      : 'text-awn-text-secondary hover:text-awn-text-primary border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-awn-text-muted tabular-nums">
            {isRtl ? (
              <>
                عرض <span className="font-semibold text-awn-text-primary">{formatNumber(items.length)}</span> من أصل{' '}
                <span className="font-semibold text-awn-text-primary">{formatNumber(pagination.totalItems)}</span>{' '}
                سجل
              </>
            ) : (
              <>
                Showing <span className="font-semibold text-awn-text-primary">{items.length}</span> of{' '}
                <span className="font-semibold text-awn-text-primary">{pagination.totalItems}</span>{' '}
                records
              </>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No matching records found in this view"
          description={
            searchQuery || statusFilter !== 'ALL'
              ? 'No records matched your current search or status filter criteria. Reset filters to view all workspace entries.'
              : 'This workspace currently has no registered entries.'
          }
          secondaryActionLabel={
            searchQuery || statusFilter !== 'ALL' ? 'Reset Active Filters' : null
          }
          onSecondaryAction={
            searchQuery || statusFilter !== 'ALL'
              ? () => {
                  onSearchChange?.('');
                  onStatusFilterChange?.('ALL');
                }
              : null
          }
          primaryActionLabel={onCreateNew ? createLabel : null}
          onPrimaryAction={onCreateNew}
        />
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-awn-surface-alt border-b border-awn-border text-xs font-semibold text-awn-text-secondary">
                  <th className="py-3 px-4 whitespace-nowrap">
                    {isRtl ? 'رمز السجل' : 'Reference ID'}
                  </th>
                  <th className="py-3 px-4">
                    {isRtl ? 'اسم الأصل والسجل' : 'Record Designation'}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    {isRtl ? 'التصنيف والنوع' : 'Category & Type'}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    {isRtl ? 'الموقع وأمين العهدة' : 'Location & Custodian'}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    {isRtl ? 'الحالة' : 'Status'}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap text-right rtl:text-left">
                    {isRtl ? 'آخر تحديث' : 'Last Updated'}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap text-right rtl:text-left">
                    {isRtl ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-awn-border text-sm">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-awn-surface-alt transition-colors duration-100"
                  >
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewRow?.(item)}
                        className="font-mono text-xs font-semibold text-awn-primary hover:underline tabular-nums cursor-pointer"
                      >
                        {item.code}
                      </button>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <div className="font-medium text-awn-text-primary leading-snug">
                        {item.name}
                      </div>
                      <div className="text-xs text-awn-text-muted mt-0.5 flex items-center gap-1.5">
                        <span>{item.classification}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{item.serialNumber}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <div className="text-xs font-medium text-awn-text-primary">
                        {item.category}
                      </div>
                      <div className="text-xs text-awn-text-secondary mt-0.5">
                        {item.type}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <div className="text-xs text-awn-text-primary">{item.location}</div>
                      <div className="text-xs text-awn-text-secondary mt-0.5">
                        {item.custodian}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <StatusBadge label={item.status} tone={item.statusTone} />
                    </td>
                    <td className="py-3 px-4 align-middle whitespace-nowrap text-right font-mono text-xs text-awn-text-secondary tabular-nums">
                      {item.updatedAt}
                    </td>
                    <td className="py-3 px-4 align-middle whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        {onViewRow && (
                          <button
                            type="button"
                            onClick={() => onViewRow(item)}
                            title="Inspect details"
                            aria-label={`Inspect ${item.name}`}
                            className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-surface border border-transparent hover:border-awn-border cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEditRow && (
                          <button
                            type="button"
                            onClick={() => onEditRow(item)}
                            title="Edit record"
                            aria-label={`Edit ${item.name}`}
                            className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-surface border border-transparent hover:border-awn-border cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteRow && (
                          <button
                            type="button"
                            onClick={() => onDeleteRow(item)}
                            title="Remove record"
                            aria-label={`Remove ${item.name}`}
                            className="p-1.5 rounded text-awn-text-secondary hover:text-awn-error hover:bg-awn-error-soft border border-transparent cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-awn-border">
            {items.map((item) => (
              <div key={item.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <button
                      type="button"
                      onClick={() => onViewRow?.(item)}
                      className="font-mono text-xs font-semibold text-awn-primary hover:underline tabular-nums cursor-pointer"
                    >
                      {item.code}
                    </button>
                    <h3 className="text-sm font-semibold text-awn-text-primary mt-0.5">
                      {item.name}
                    </h3>
                  </div>
                  <StatusBadge label={item.status} tone={item.statusTone} />
                </div>
                <div className="text-xs text-awn-text-secondary space-y-1">
                  <div>
                    <span className="text-awn-text-muted">Category: </span>
                    <span className="text-awn-text-primary font-medium">{item.category}</span>
                    <span> · {item.type}</span>
                  </div>
                  <div>
                    <span className="text-awn-text-muted">Location: </span>
                    <span>{item.location}</span>
                    <span> · {item.custodian}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="px-4 py-3 bg-awn-surface-alt border-t border-awn-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-awn-text-secondary">
        <div className="tabular-nums">
          {isRtl ? (
            <>
              صفحة <span className="font-semibold text-awn-text-primary">{formatNumber(pagination.page)}</span> من{' '}
              <span className="font-semibold text-awn-text-primary">{formatNumber(pagination.totalPages)}</span>
            </>
          ) : (
            <>
              Page <span className="font-semibold text-awn-text-primary">{pagination.page}</span> of{' '}
              <span className="font-semibold text-awn-text-primary">{pagination.totalPages}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1 || loading}
            onClick={() => onPageChange?.(pagination.page - 1)}
            leftIcon={isRtl ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          >
            {isRtl ? 'السابق' : 'Previous'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() => onPageChange?.(pagination.page + 1)}
            rightIcon={isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          >
            {isRtl ? 'التالي' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
