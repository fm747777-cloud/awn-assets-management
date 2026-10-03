import React, { useState } from 'react';
import {
  tableFeatures,
  useTable,
  rowPaginationFeature,
  rowSelectionFeature,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type Row,
  type Cell,
  type TableFeatures,
  type RowData,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
} from 'lucide-react';
import { Input } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { TableSkeleton } from '../ui/LoadingState.tsx';
import { formatLocalizedNumber } from '../../i18n/index.ts';

/**
 * Shared TanStack Table v9 feature configuration.
 * Configured statically outside the component lifecycle for stable reference.
 */
export const dataTableFeatures = tableFeatures({
  rowPaginationFeature,
  rowSelectionFeature,
});

export type DataTableProps<TData extends RowData = RowData> = {
  columns: Array<ColumnDef<typeof dataTableFeatures, TData>>;
  data: TData[];
  count: number;

  loading?: boolean;
  searchPlaceholder?: string;

  pageIndex: number;
  pageSize: number;

  onPageChange: (newPageIndex: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;

  searchValue?: string;
  onSearchChange?: (value: string) => void;

  onAddNew?: () => void;
  onExport?: () => void;

  title: string;
};

/**
 * Helper to safely extract visible cells from a row.
 * Uses visible cells when supported or filters by column visibility.
 */
function getRowVisibleCells<TFeatures extends TableFeatures, TData extends RowData>(
  row: Row<TFeatures, TData>
): Array<Cell<TFeatures, TData, unknown>> {
  if (
    'getVisibleCells' in row &&
    typeof (row as { getVisibleCells?: () => Array<Cell<TFeatures, TData, unknown>> }).getVisibleCells === 'function'
  ) {
    return (row as { getVisibleCells: () => Array<Cell<TFeatures, TData, unknown>> }).getVisibleCells();
  }

  return row.getAllCells().filter((cell) => {
    if (
      'getIsVisible' in cell.column &&
      typeof (cell.column as { getIsVisible?: () => boolean }).getIsVisible === 'function'
    ) {
      return (cell.column as { getIsVisible: () => boolean }).getIsVisible();
    }
    return true;
  });
}

/**
 * Generic, reusable DataTable component built on TanStack Table v9.
 * Presentational and headless; data fetching, state ownership, and business logic
 * remain fully controlled by the parent caller.
 */
export function DataTable<TData extends RowData = RowData>({
  columns,
  data,
  count,
  loading = false,
  searchPlaceholder,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  searchValue = '',
  onSearchChange,
  onAddNew,
  onExport,
  title,
}: DataTableProps<TData>) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl' || i18n.language === 'ar';

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const safePageSize = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(count / safePageSize));

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    manualPagination: true,
    pageCount,
    rowCount: count,
    enableRowSelection: true,
    state: {
      pagination: {
        pageIndex,
        pageSize: safePageSize,
      },
      rowSelection,
    },
    onPaginationChange: (updater) => {
      const nextPagination: PaginationState =
        typeof updater === 'function'
          ? updater({ pageIndex, pageSize: safePageSize })
          : updater;

      if (nextPagination.pageIndex !== pageIndex) {
        onPageChange(nextPagination.pageIndex);
      }
      if (onPageSizeChange && nextPagination.pageSize !== safePageSize) {
        onPageSizeChange(nextPagination.pageSize);
      }
    },
    onRowSelectionChange: setRowSelection,
  });

  const startRecord = count === 0 ? 0 : pageIndex * safePageSize + 1;
  const endRecord = Math.min((pageIndex + 1) * safePageSize, count);
  const leafColumnCount = table.getAllLeafColumns().length || 4;

  return (
    <div className="bg-awn-surface border border-awn-border rounded-lg overflow-hidden shadow-xs">
      {/* Table Toolbar Header */}
      <div className="p-4 border-b border-awn-border space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-awn-text-primary tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-awn-text-secondary mt-0.5 tabular-nums">
              {isRtl ? (
                <>
                  {t('common.showing', { defaultValue: 'عرض' })}{' '}
                  <span className="font-semibold text-awn-text-primary">
                    {formatLocalizedNumber(data.length)}
                  </span>{' '}
                  {t('common.of', { defaultValue: 'من' })}{' '}
                  <span className="font-semibold text-awn-text-primary">
                    {formatLocalizedNumber(count)}
                  </span>{' '}
                  {t('common.records', { defaultValue: 'سجل' })}
                </>
              ) : (
                <>
                  {t('common.showing', { defaultValue: 'Showing' })}{' '}
                  <span className="font-semibold text-awn-text-primary">
                    {formatLocalizedNumber(data.length)}
                  </span>{' '}
                  {t('common.of', { defaultValue: 'of' })}{' '}
                  <span className="font-semibold text-awn-text-primary">
                    {formatLocalizedNumber(count)}
                  </span>{' '}
                  {t('common.records', { defaultValue: 'records' })}
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSearchChange && (
              <div className="w-full sm:w-64">
                <Input
                  type="text"
                  placeholder={
                    searchPlaceholder ||
                    t('common.searchPlaceholder', { defaultValue: 'Search...' })
                  }
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onClear={() => onSearchChange('')}
                  leftIcon={<Search className="w-3.5 h-3.5" />}
                  aria-label={t('common.search', { defaultValue: 'Search' })}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  ariaLabel={t('common.exportCsv', { defaultValue: 'Export CSV' })}
                >
                  {t('common.exportCsv', { defaultValue: 'Export CSV' })}
                </Button>
              )}
              {onAddNew && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onAddNew}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  ariaLabel={t('common.new', { defaultValue: 'Add New' })}
                >
                  {t('common.new', { defaultValue: 'Add New' })}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Content States */}
      {loading ? (
        <div className="p-4">
          <TableSkeleton rows={Math.min(safePageSize, 5)} columns={leafColumnCount} />
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          title={
            searchValue
              ? t('common.noMatchingRecords', { defaultValue: 'No matching records found' })
              : t('common.noRecords', { defaultValue: 'No records found' })
          }
          description={
            searchValue
              ? t('common.adjustFiltersNotice', {
                  defaultValue: 'Adjust your active filters or search query, or register a new record in this workspace.',
                })
              : t('common.adjustFiltersNotice', {
                  defaultValue: 'This workspace currently has no registered entries.',
                })
          }
          secondaryActionLabel={
            searchValue && onSearchChange
              ? t('common.reset', { defaultValue: 'Reset Search' })
              : null
          }
          onSecondaryAction={
            searchValue && onSearchChange ? () => onSearchChange('') : null
          }
          primaryActionLabel={
            onAddNew ? t('common.new', { defaultValue: 'Add New' }) : null
          }
          onPrimaryAction={onAddNew ?? null}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-awn-surface-alt border-b border-awn-border text-xs font-semibold text-awn-text-secondary"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className="py-3 px-4 whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-awn-border text-sm">
              {table.getRowModel().rows.map((row) => {
                const cells = getRowVisibleCells(row);
                const isSelected = row.getIsSelected?.();

                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-awn-surface-alt/70 transition-colors duration-100 ${
                      isSelected ? 'bg-awn-primary-soft/40' : ''
                    }`}
                  >
                    {cells.map((cell) => (
                      <td
                        key={cell.id}
                        className="py-3 px-4 align-middle whitespace-nowrap text-awn-text-primary"
                      >
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="px-4 py-3 bg-awn-surface-alt border-t border-awn-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-awn-text-secondary">
        <div className="flex flex-wrap items-center gap-4 tabular-nums">
          <div>
            {isRtl ? (
              <>
                {t('common.showing', { defaultValue: 'عرض' })}{' '}
                <span className="font-semibold text-awn-text-primary">
                  {formatLocalizedNumber(startRecord)} - {formatLocalizedNumber(endRecord)}
                </span>{' '}
                {t('common.of', { defaultValue: 'من' })}{' '}
                <span className="font-semibold text-awn-text-primary">
                  {formatLocalizedNumber(count)}
                </span>{' '}
                {t('common.records', { defaultValue: 'سجل' })}
              </>
            ) : (
              <>
                {t('common.showing', { defaultValue: 'Showing' })}{' '}
                <span className="font-semibold text-awn-text-primary">
                  {formatLocalizedNumber(startRecord)} - {formatLocalizedNumber(endRecord)}
                </span>{' '}
                {t('common.of', { defaultValue: 'of' })}{' '}
                <span className="font-semibold text-awn-text-primary">
                  {formatLocalizedNumber(count)}
                </span>{' '}
                {t('common.records', { defaultValue: 'records' })}
              </>
            )}
          </div>

          <div className="text-awn-text-muted">
            {isRtl ? (
              <>
                {t('common.page', { defaultValue: 'صفحة' })}{' '}
                <span className="font-semibold text-awn-text-primary">
                  {formatLocalizedNumber(pageIndex + 1)}
                </span>{' '}
                {t('common.of', { defaultValue: 'من' })}{' '}
                <span className="font-semibold text-awn-text-primary">
                  {formatLocalizedNumber(pageCount)}
                </span>
              </>
            ) : (
              <>
                {t('common.page', { defaultValue: 'Page' })}{' '}
                <span className="font-semibold text-awn-text-primary">
                  {formatLocalizedNumber(pageIndex + 1)}
                </span>{' '}
                {t('common.of', { defaultValue: 'of' })}{' '}
                <span className="font-semibold text-awn-text-primary">
                  {formatLocalizedNumber(pageCount)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onPageSizeChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-awn-text-muted">
                {isRtl ? 'لكل صفحة:' : 'Per page:'}
              </span>
              <select
                value={safePageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-8 px-2 rounded-md bg-awn-surface text-xs text-awn-text-primary border border-awn-border hover:border-awn-border-strong focus:outline-awn-primary transition-colors cursor-pointer"
                aria-label={isRtl ? 'عدد السجلات بالصفحة' : 'Rows per page'}
              >
                {[5, 8, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {formatLocalizedNumber(size)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={pageIndex <= 0 || loading}
              onClick={() => onPageChange(pageIndex - 1)}
              leftIcon={
                isRtl ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )
              }
              ariaLabel={t('common.previous', { defaultValue: 'Previous' })}
            >
              {t('common.previous', { defaultValue: 'Previous' })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pageIndex >= pageCount - 1 || loading}
              onClick={() => onPageChange(pageIndex + 1)}
              rightIcon={
                isRtl ? (
                  <ChevronLeft className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )
              }
              ariaLabel={t('common.next', { defaultValue: 'Next' })}
            >
              {t('common.next', { defaultValue: 'Next' })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
