import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Ban,
  Download,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { assetModuleService } from '../services/assetModuleService.ts';
import { useToast } from '../hooks/useToast.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Input, Textarea } from '../components/ui/Input.tsx';
import { Select } from '../components/ui/Select.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { Drawer } from '../components/ui/Drawer.tsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.tsx';
import { FormSection } from '../components/ui/FormSection.tsx';
import { DataTable, dataTableFeatures } from '../components/table/DataTable.tsx';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  AssetStatus,
  AssetStatusFormData,
  AssetStatusesQueryResponse,
  SelectOption,
  ValidationErrors,
} from '../types/index.ts';

const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: 'English', label: 'English' },
  { value: 'Arabic (العربية)', label: 'Arabic (العربية)' },
  { value: 'Bilingual (EN / AR)', label: 'Bilingual (EN / AR)' },
];

const DEFAULT_STATUS_DESCRIPTIONS_AR: Record<string, string> = {
  Pending:
    'تشير هذه الحالة إلى أن الطلب تم تقديمه بنجاح وهو بانتظار المراجعة أو الاعتماد. لم يتم اتخاذ أي إجراء بعد، والطلب حالياً في قائمة الانتظار للمعالجة كأول مرحلة في مسار الطلب.',
  Completed:
    'تشير هذه الحالة إلى أن إجراء دورة حياة الأصل أو الطلب قد تم تنفيذه بالكامل والتحقق منه رسمياً.',
  Inprogress:
    'تشير هذه الحالة إلى أن الطلب قيد المعالجة الفنية أو الإدارية النشطة حالياً.',
  Rejected:
    'تشير هذه الحالة إلى أن الطلب أو إجراء الأصل تم رفضه رسمياً ولم تتم الموافقة عليه.',
  Todo:
    'تشير هذه الحالة إلى مهمة أو إجراء مستحق قيد المتابعة ولم يبدأ العمل عليه بعد.',
};

export default function AssetStatusPage() {
  const { showToast } = useToast();
  const { isRtl, formatNumber, t } = useLanguage();

  const getLocalizedStatusName = useCallback(
    (name: string) => {
      if (!isRtl) return name;
      const map: Record<string, string> = {
        Pending: t('assetStatus.pending'),
        Completed: t('assetStatus.completed'),
        Inprogress: t('assetStatus.inprogress'),
        'In Progress': t('assetStatus.inprogress'),
        Rejected: t('assetStatus.rejected'),
        Todo: t('assetStatus.todo'),
        Active: t('assetStatus.active'),
        Deactivated: t('assetStatus.deactivated'),
      };
      return map[name] || name;
    },
    [isRtl, t]
  );

  const getLocalizedDescription = useCallback(
    (status: AssetStatus) => {
      if (!isRtl) return status.description || t('assetStatus.noDescription');
      return (
        DEFAULT_STATUS_DESCRIPTIONS_AR[status.statusName] ||
        status.description ||
        t('assetStatus.noDescription')
      );
    },
    [isRtl, t]
  );

  // Table & Query State
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [statusesData, setStatusesData] = useState<AssetStatusesQueryResponse>({
    items: [],
    allMatchingItems: [],
    summaryTotalLabel: '5 Status States',
    totalRecordsCount: 5,
    activeCount: 4,
    deactivatedCount: 1,
    pagination: { page: 1, pageSize: 8, totalItems: 0, totalPages: 1 },
  });

  // Details Drawer State
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Create / Edit Form Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<AssetStatusFormData>({
    statusCode: 'STATUS 06',
    language: 'English',
    statusName: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Deactivate Confirmation Dialog State
  const [deactivateTarget, setDeactivateTarget] = useState<AssetStatus | null>(null);

  // Delete Confirmation Dialog State
  const [deleteTarget, setDeleteTarget] = useState<AssetStatus | null>(null);

  const fetchStatuses = useCallback(
    async (targetPage = currentPage) => {
      setLoading(true);
      try {
        const response = await assetModuleService.getAssetStatuses({
          search: searchQuery,
          page: targetPage,
          pageSize,
        });
        setStatusesData(response);
        setCurrentPage(response.pagination.page);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, currentPage]
  );

  useEffect(() => {
    fetchStatuses(1);
  }, [searchQuery]);

  // ============================================================================
  // DETAILS HANDLERS
  // ============================================================================
  const handleOpenStatusDetails = (assetStatus: AssetStatus) => {
    setSelectedStatus(assetStatus);
    setDetailsOpen(true);
  };

  // ============================================================================
  // CREATE / EDIT FORM HANDLERS
  // ============================================================================
  const handleOpenCreateModal = () => {
    const nextCode = assetModuleService.generateNextStatusCode();
    setFormMode('create');
    setFormData({
      statusCode: nextCode,
      language: 'English',
      statusName: '',
      description: '',
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (assetStatus: AssetStatus) => {
    setFormMode('edit');
    setFormData({
      statusCode: assetStatus.statusCode,
      language: assetStatus.language || 'English',
      statusName: assetStatus.statusName,
      description: assetStatus.description,
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const validateStatusForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!formData.statusName.trim()) {
      errors.statusName = 'Status Name is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStatusForm()) return;

    setSubmitting(true);
    try {
      if (formMode === 'create') {
        const created = await assetModuleService.createAssetStatus({
          statusCode: formData.statusCode,
          language: formData.language,
          statusName: formData.statusName,
          description: formData.description,
        });
        setFormModalOpen(false);
        setSelectedStatus(created);
        await fetchStatuses(1);
        showToast({
          title: `Asset Status ${created.statusCode} Created`,
          description: `"${created.statusName}" has been added to Asset Status.`,
          variant: 'success',
        });
      } else {
        const updated = await assetModuleService.updateAssetStatus(
          formData.statusCode,
          {
            language: formData.language,
            statusName: formData.statusName,
            description: formData.description,
          }
        );
        setFormModalOpen(false);
        if (selectedStatus?.statusCode === updated.statusCode) {
          setSelectedStatus(updated);
        }
        await fetchStatuses(currentPage);
        showToast({
          title: `Asset Status ${updated.statusCode} Updated`,
          description: `Changes to "${updated.statusName}" have been saved.`,
          variant: 'success',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // DEACTIVATE STATUS HANDLERS
  // ============================================================================
  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setSubmitting(true);
    try {
      const updated = await assetModuleService.deactivateAssetStatus(
        deactivateTarget.statusCode
      );
      if (selectedStatus?.statusCode === updated.statusCode) {
        setSelectedStatus(updated);
      }
      setDeactivateTarget(null);
      await fetchStatuses(currentPage);
      showToast({
        title: `Asset Status ${updated.statusCode} Deactivated`,
        description: `"${updated.statusName}" is now marked as Deactivated.`,
        variant: 'info',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // DELETE STATUS HANDLERS
  // ============================================================================
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const targetCode = deleteTarget.statusCode;
      const targetName = deleteTarget.statusName;
      await assetModuleService.deleteAssetStatus(targetCode);

      if (selectedStatus?.statusCode === targetCode) {
        setDetailsOpen(false);
        setSelectedStatus(null);
      }
      setDeleteTarget(null);
      await fetchStatuses(currentPage);
      showToast({
        title: `Asset Status ${targetCode} Deleted`,
        description: `"${targetName}" has been removed from Asset Status.`,
        variant: 'info',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // EXPORT CSV HANDLER
  // ============================================================================
  const handleExportCsv = () => {
    const recordsToExport = statusesData.allMatchingItems;
    if (!recordsToExport || recordsToExport.length === 0) {
      showToast({
        title: 'No statuses to export',
        description: 'Adjust your search filter before exporting to CSV.',
        variant: 'warning',
      });
      return;
    }

    const csvContent = assetModuleService.exportAssetStatusesCsv(recordsToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `AWN_Asset_Status_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      title: 'Exported Asset Status CSV',
      description: `${recordsToExport.length} status record(s) exported to AWN_Asset_Status_${today}.csv.`,
      variant: 'success',
    });
  };

  const columns = useMemo<ColumnDef<typeof dataTableFeatures, AssetStatus>[]>(
    () => [
      {
        id: 'statusCode',
        accessorKey: 'statusCode',
        header: () => t('assetStatus.colStatusCode'),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => handleOpenStatusDetails(row.original)}
            className="font-mono text-xs font-semibold text-awn-primary hover:underline tabular-nums cursor-pointer"
          >
            {row.original.statusCode}
          </button>
        ),
      },
      {
        id: 'statusName',
        accessorKey: 'statusName',
        header: () => t('assetStatus.colTagsName'),
        cell: ({ row }) => {
          const localizedStatusName = getLocalizedStatusName(row.original.statusName);
          return (
            <button
              type="button"
              onClick={() => handleOpenStatusDetails(row.original)}
              className="font-medium text-awn-text-primary hover:text-awn-primary text-left rtl:text-right transition-colors cursor-pointer"
            >
              {localizedStatusName}
            </button>
          );
        },
      },
      {
        id: 'author',
        header: () => t('assetStatus.colAuthorCreator'),
        cell: ({ row }) => (
          <div className="text-xs">
            <span className="font-medium text-awn-text-primary block">
              {row.original.authorName}
            </span>
            <span className="text-awn-text-secondary font-mono text-[11px] block">
              {row.original.authorEmail}
            </span>
          </div>
        ),
      },
      {
        id: 'createdDate',
        accessorKey: 'createdDate',
        header: () => t('assetStatus.colCreatedDate'),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-awn-text-secondary tabular-nums">
            {row.original.createdDate}
          </span>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: () => t('assetStatus.colStatus'),
        cell: ({ row }) => (
          <StatusBadge label={row.original.status} tone={row.original.statusTone} />
        ),
      },
      {
        id: 'actions',
        header: () => (
          <span className="block text-right rtl:text-left">
            {t('assetStatus.colActions')}
          </span>
        ),
        cell: ({ row }) => {
          const assetStatus = row.original;
          const isActive = assetStatus.status === 'Active';
          const localizedStatusName = getLocalizedStatusName(assetStatus.statusName);
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => handleOpenStatusDetails(assetStatus)}
                title={isRtl ? `عرض ${localizedStatusName}` : `View ${assetStatus.statusName}`}
                aria-label={isRtl ? `عرض ${localizedStatusName}` : `View ${assetStatus.statusName}`}
                className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-primary-soft transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenEditModal(assetStatus)}
                title={isRtl ? `تعديل ${localizedStatusName}` : `Edit ${assetStatus.statusName}`}
                aria-label={isRtl ? `تعديل ${localizedStatusName}` : `Edit ${assetStatus.statusName}`}
                className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-primary-soft transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {isActive && (
                <button
                  type="button"
                  onClick={() => setDeactivateTarget(assetStatus)}
                  title={isRtl ? `تعطيل ${localizedStatusName}` : `Deactivate ${assetStatus.statusName}`}
                  aria-label={isRtl ? `تعطيل ${localizedStatusName}` : `Deactivate ${assetStatus.statusName}`}
                  className="p-1.5 rounded text-awn-text-secondary hover:text-awn-warning hover:bg-awn-warning-soft transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeleteTarget(assetStatus)}
                title={isRtl ? `حذف ${localizedStatusName}` : `Delete ${assetStatus.statusName}`}
                aria-label={isRtl ? `حذف ${localizedStatusName}` : `Delete ${assetStatus.statusName}`}
                className="p-1.5 rounded text-awn-text-secondary hover:text-awn-error hover:bg-awn-error-soft transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [isRtl, t]
  );

  return (
    <div className="space-y-5">
      {/* Page Header with exact Title, Description, and Actions ("Export CSV", "New Status") */}
      <PageHeader
        title={t('assetStatus.title')}
        description={t('assetStatus.description')}
        contextMeta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-awn-text-secondary tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-semibold text-awn-text-primary">
              <Activity className="w-3.5 h-3.5 text-awn-primary" aria-hidden="true" />
              <span>
                {isRtl
                  ? t('assetStatus.summaryLabel', {
                      count: formatNumber(statusesData.totalRecordsCount),
                    })
                  : statusesData.summaryTotalLabel}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(statusesData.activeCount)}
              </strong>{' '}
              {t('assetStatus.active')}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(statusesData.deactivatedCount)}
              </strong>{' '}
              {t('assetStatus.deactivated')}
            </span>
          </div>
        }
        secondaryActions={
          <Button
            variant="outline"
            size="md"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCsv}
          >
            {t('assetStatus.exportCsv')}
          </Button>
        }
        primaryAction={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreateModal}
          >
            {t('assetStatus.newStatus')}
          </Button>
        }
      />

      {/* Main Asset Status Table */}
      <DataTable
        title={t('assetStatus.title')}
        columns={columns}
        data={statusesData.items}
        count={statusesData.pagination.totalItems}
        loading={loading}
        pageIndex={currentPage - 1}
        pageSize={pageSize}
        onPageChange={(newPageIndex) => {
          const next = newPageIndex + 1;
          setCurrentPage(next);
          fetchStatuses(next);
        }}
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder={t('assetStatus.searchPlaceholder')}
        onAddNew={handleOpenCreateModal}
        onExport={handleExportCsv}
      />

      {/* ========================================================================
          STATUS DETAILS DRAWER (Sections 10, 11)
          ======================================================================== */}
      <Drawer
        isOpen={detailsOpen && Boolean(selectedStatus)}
        onClose={() => setDetailsOpen(false)}
        title={
          selectedStatus
            ? `${selectedStatus.statusCode} · ${getLocalizedStatusName(
                selectedStatus.statusName
              )}`
            : t('assetStatus.viewEditStatus')
        }
        subtitle={t('assetStatus.statusSpec')}
        size="lg"
        footer={
          selectedStatus ? (
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {selectedStatus.status === 'Active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Ban className="w-3.5 h-3.5" />}
                    onClick={() => setDeactivateTarget(selectedStatus)}
                  >
                    {t('assetStatus.deleteRequestStatus')}
                  </Button>
                )}
                <Button
                  variant="dangerOutline"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => setDeleteTarget(selectedStatus)}
                >
                  {t('assetStatus.deleteStatus')}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailsOpen(false)}
                >
                  {t('assetStatus.close')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Pencil className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenEditModal(selectedStatus)}
                >
                  {t('assetStatus.editStatus')}
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {selectedStatus && (
          <div className="space-y-6">
            {/* Status Summary Banner */}
            <div className="p-4 rounded-lg bg-awn-surface-alt border border-awn-border flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-awn-text-muted tabular-nums">
                  {selectedStatus.statusCode}
                </div>
                <div className="text-base font-semibold text-awn-text-primary mt-0.5">
                  {getLocalizedStatusName(selectedStatus.statusName)}
                </div>
                <div className="text-xs text-awn-text-secondary mt-1">
                  {t('assetStatus.createdDate')}: {selectedStatus.createdDate}
                </div>
              </div>
              <StatusBadge
                label={selectedStatus.status}
                tone={selectedStatus.statusTone}
              />
            </div>

            {/* Status Details Attributes */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-awn-text-primary">
                {t('assetStatus.statusDetails')}
              </h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">
                    {t('assetStatus.statusCode')}
                  </dt>
                  <dd className="font-mono font-semibold text-awn-text-primary mt-1 tabular-nums">
                    {selectedStatus.statusCode}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">
                    {t('assetStatus.tagsName')}
                  </dt>
                  <dd className="font-semibold text-awn-text-primary mt-1">
                    {getLocalizedStatusName(selectedStatus.statusName)}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">
                    {t('assetStatus.language')}
                  </dt>
                  <dd className="font-medium text-awn-text-primary mt-1">
                    {selectedStatus.language || 'English'}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">
                    {t('assetStatus.colStatus')}
                  </dt>
                  <dd className="mt-1">
                    <StatusBadge
                      label={selectedStatus.status}
                      tone={selectedStatus.statusTone}
                    />
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">
                    {t('assetStatus.authorCreator')}
                  </dt>
                  <dd className="font-medium text-awn-text-primary mt-1">
                    {selectedStatus.authorName}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">
                    {t('assetStatus.email')}
                  </dt>
                  <dd className="font-mono text-awn-text-primary mt-1 break-all">
                    {selectedStatus.authorEmail}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">
                    {t('assetStatus.createdDate')}
                  </dt>
                  <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                    {selectedStatus.createdDate}
                  </dd>
                </div>
                <div className="sm:col-span-2 p-3.5 rounded-md border border-awn-border bg-awn-surface-alt">
                  <dt className="text-awn-text-muted">
                    {t('assetStatus.descriptionLabel')}
                  </dt>
                  <dd className="font-medium text-awn-text-primary mt-1 leading-relaxed">
                    {getLocalizedDescription(selectedStatus)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================================
          CREATE NEW STATUS / EDIT STATUS MODAL (Sections 12, 13)
          ======================================================================== */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={
          formMode === 'create'
            ? t('assetStatus.createNewStatus')
            : t('assetStatus.editStatus')
        }
        description={
          formMode === 'create'
            ? t('assetStatus.createDesc')
            : t('assetStatus.editDesc', { code: formData.statusCode })
        }
        size="md"
        footer={
          formMode === 'create' ? (
            <>
              <Button
                variant="outline"
                onClick={() => setFormModalOpen(false)}
                disabled={submitting}
              >
                {t('assetStatus.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleFormSubmit}
                loading={submitting}
              >
                {t('assetStatus.submit')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setFormModalOpen(false)}
                disabled={submitting}
              >
                {t('assetStatus.discardChanges')}
              </Button>
              <Button
                variant="primary"
                onClick={handleFormSubmit}
                loading={submitting}
              >
                {t('assetStatus.saveAndUpdate')}
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleFormSubmit} noValidate>
          <FormSection
            title={t('assetStatus.statusInfo')}
            description={t('assetStatus.statusInfoDesc')}
            columns={1}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('assetStatus.statusCode')}
                value={formData.statusCode}
                disabled
                readOnly
                description={t('assetStatus.autogenerated')}
              />
              <Select
                label={t('assetStatus.language')}
                options={
                  isRtl
                    ? [
                        { value: 'English', label: 'الإنجليزية' },
                        { value: 'Arabic (العربية)', label: 'العربية' },
                        { value: 'Bilingual (EN / AR)', label: 'ثنائي اللغة (EN / AR)' },
                      ]
                    : LANGUAGE_OPTIONS
                }
                value={formData.language}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, language: e.target.value }))
                }
              />
            </div>

            {/* Preserving exact visible wording: Status Name * with placeholder Enter Tag Name */}
            <Input
              label={t('assetStatus.statusNameRequired')}
              required
              placeholder={t('assetStatus.statusNamePlaceholder')}
              value={formData.statusName}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({ ...prev, statusName: val }));
                if (formErrors.statusName) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.statusName;
                    return next;
                  });
                }
              }}
              error={
                formErrors.statusName
                  ? t('assetStatus.nameRequired')
                  : undefined
              }
            />

            <Textarea
              label={t('assetStatus.descriptionLabel')}
              rows={3}
              placeholder={t('assetStatus.descPlaceholder')}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </FormSection>
        </form>
      </Modal>

      {/* ========================================================================
          DEACTIVATE STATUS CONFIRMATION DIALOG (Section 16)
          ======================================================================== */}
      <ConfirmDialog
        isOpen={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleConfirmDeactivate}
        title={t('assetStatus.deactivateTitle')}
        description={t('assetStatus.deactivateDesc')}
        itemSummary={
          deactivateTarget
            ? `${deactivateTarget.statusCode} — ${getLocalizedStatusName(
                deactivateTarget.statusName
              )}`
            : ''
        }
        confirmLabel={t('assetStatus.confirmDeactivate')}
        cancelLabel={t('assetStatus.cancel')}
        loading={submitting}
      />

      {/* ========================================================================
          DELETE STATUS CONFIRMATION DIALOG (Section 17)
          ======================================================================== */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={t('assetStatus.deleteTitle')}
        description={t('assetStatus.deleteDesc')}
        itemSummary={
          deleteTarget
            ? `${deleteTarget.statusCode} — ${getLocalizedStatusName(
                deleteTarget.statusName
              )}`
            : ''
        }
        confirmLabel={t('assetStatus.confirmDelete')}
        cancelLabel={t('assetStatus.cancel')}
        loading={submitting}
      />
    </div>
  );
}
