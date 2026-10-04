import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Download,
  Eye,
  Layers,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { assetModuleService } from '../services/assetModuleService.ts';
import { useToast } from '../hooks/useToast.tsx';
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
import { useLanguage } from '../hooks/useLanguage.tsx';
import type {
  AssetType,
  AssetTypeFormData,
  AssetTypesQueryResponse,
  SelectOption,
  ValidationErrors,
} from '../types/index.ts';

const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: 'English', label: 'English' },
  { value: 'Arabic (العربية)', label: 'Arabic (العربية)' },
  { value: 'Bilingual (EN / AR)', label: 'Bilingual (EN / AR)' },
];

export default function AssetTypesPage() {
  const { showToast } = useToast();
  const { isRtl, formatNumber } = useLanguage();

  // Table & Query State
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [typesData, setTypesData] = useState<AssetTypesQueryResponse>({
    items: [],
    allMatchingItems: [],
    summaryTotalLabel: '34 Asset Types',
    totalRecordsCount: 5,
    activeCount: 4,
    inactiveCount: 1,
    pagination: { page: 1, pageSize: 8, totalItems: 0, totalPages: 1 },
  });

  // Dynamic Category Options from existing Asset Categories catalog
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);

  // Details Drawer State
  const [selectedType, setSelectedType] = useState<AssetType | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Create / Edit Form Modal State (reusing the same form structure)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<AssetTypeFormData>({
    typeId: 'AT-006',
    language: 'English',
    typeName: '',
    category: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Deactivate Confirmation Dialog State
  const [deactivateTarget, setDeactivateTarget] = useState<AssetType | null>(null);

  // Delete Confirmation Dialog State
  const [deleteTarget, setDeleteTarget] = useState<AssetType | null>(null);

  const fetchTypes = useCallback(
    async (targetPage = currentPage) => {
      setLoading(true);
      try {
        const response = await assetModuleService.getAssetTypes({
          search: searchQuery,
          page: targetPage,
          pageSize,
        });
        setTypesData(response);
        setCurrentPage(response.pagination.page);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, currentPage]
  );

  const loadCategoryOptions = useCallback(async () => {
    try {
      const opts = await assetModuleService.getCategorySelectOptions();
      setCategoryOptions(opts);
    } catch {
      // Keep existing category options on error
    }
  }, []);

  useEffect(() => {
    fetchTypes(1);
    loadCategoryOptions();
  }, [searchQuery, loadCategoryOptions]);

  // ============================================================================
  // DETAILS HANDLERS
  // ============================================================================
  const handleOpenTypeDetails = (assetType: AssetType) => {
    setSelectedType(assetType);
    setDetailsOpen(true);
  };

  // ============================================================================
  // CREATE / EDIT FORM HANDLERS (Reusing Single Form Implementation)
  // ============================================================================
  const handleOpenCreateModal = async () => {
    await loadCategoryOptions();
    const nextId = assetModuleService.generateNextTypeId();
    setFormMode('create');
    setFormData({
      typeId: nextId,
      language: 'English',
      typeName: '',
      category: '',
      description: '',
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleOpenEditModal = async (assetType: AssetType) => {
    await loadCategoryOptions();
    setFormMode('edit');
    setFormData({
      typeId: assetType.typeId,
      language: assetType.language || 'English',
      typeName: assetType.typeName,
      category: assetType.category,
      description: assetType.description,
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const validateTypeForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!formData.typeName.trim()) {
      errors.typeName = 'Type Name is required.';
    }
    if (!formData.category.trim()) {
      errors.category = 'Asset Category is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateTypeForm()) return;

    setSubmitting(true);
    try {
      if (formMode === 'create') {
        const created = await assetModuleService.createAssetType({
          typeId: formData.typeId,
          language: formData.language,
          typeName: formData.typeName,
          category: formData.category,
          description: formData.description,
        });
        setFormModalOpen(false);
        setSelectedType(created);
        await fetchTypes(1);
        await loadCategoryOptions();
        showToast({
          title: `Asset Type ${created.typeId} Created`,
          description: `"${created.typeName}" has been added to Asset Types under category "${created.category}".`,
          variant: 'success',
        });
      } else {
        const updated = await assetModuleService.updateAssetType(
          formData.typeId,
          {
            language: formData.language,
            typeName: formData.typeName,
            category: formData.category,
            description: formData.description,
          }
        );
        setFormModalOpen(false);
        if (selectedType?.typeId === updated.typeId) {
          setSelectedType(updated);
        }
        await fetchTypes(currentPage);
        await loadCategoryOptions();
        showToast({
          title: `Asset Type ${updated.typeId} Updated`,
          description: `Changes to "${updated.typeName}" have been saved.`,
          variant: 'success',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // DEACTIVATE TYPE HANDLERS
  // ============================================================================
  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setSubmitting(true);
    try {
      const updated = await assetModuleService.deactivateAssetType(
        deactivateTarget.typeId
      );
      if (selectedType?.typeId === updated.typeId) {
        setSelectedType(updated);
      }
      setDeactivateTarget(null);
      await fetchTypes(currentPage);
      showToast({
        title: `Asset Type ${updated.typeId} Deactivated`,
        description: `"${updated.typeName}" is now marked as Inactive.`,
        variant: 'info',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // DELETE TYPE HANDLERS
  // ============================================================================
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const targetId = deleteTarget.typeId;
      const targetName = deleteTarget.typeName;
      await assetModuleService.deleteAssetType(targetId);

      if (selectedType?.typeId === targetId) {
        setDetailsOpen(false);
        setSelectedType(null);
      }
      setDeleteTarget(null);
      await fetchTypes(currentPage);
      showToast({
        title: `Asset Type ${targetId} Deleted`,
        description: `"${targetName}" has been removed from Asset Types.`,
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
    const recordsToExport = typesData.allMatchingItems;
    if (!recordsToExport || recordsToExport.length === 0) {
      showToast({
        title: 'No types to export',
        description: 'Adjust your search filter before exporting to CSV.',
        variant: 'warning',
      });
      return;
    }

    const csvContent = assetModuleService.exportAssetTypesCsv(recordsToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `AWN_Asset_Types_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      title: 'Exported Asset Types CSV',
      description: `${recordsToExport.length} type record(s) exported to AWN_Asset_Types_${today}.csv.`,
      variant: 'success',
    });
  };

  // Build options for Asset Category select dropdown
  const categorySelectOptions: SelectOption[] = [
    { value: '', label: 'Select Category' },
    ...categoryOptions,
  ];

  const columns = useMemo<ColumnDef<typeof dataTableFeatures, AssetType>[]>(
    () => [
      {
        id: 'typeId',
        accessorKey: 'typeId',
        header: () => (isRtl ? 'رمز النوع' : 'Type ID'),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => handleOpenTypeDetails(row.original)}
            className="font-mono text-xs font-semibold text-awn-primary hover:underline tabular-nums cursor-pointer"
          >
            {row.original.typeId}
          </button>
        ),
      },
      {
        id: 'typeName',
        accessorKey: 'typeName',
        header: () => (isRtl ? 'اسم النوع' : 'Type Name'),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => handleOpenTypeDetails(row.original)}
            className="font-medium text-awn-text-primary hover:text-awn-primary text-left rtl:text-right transition-colors cursor-pointer"
          >
            {row.original.typeName}
          </button>
        ),
      },
      {
        id: 'category',
        accessorKey: 'category',
        header: () => (isRtl ? 'التصنيف' : 'Category'),
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-awn-surface-alt border border-awn-border text-awn-text-primary">
            {row.original.category}
          </span>
        ),
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: () => (isRtl ? 'الوصف' : 'Description'),
        cell: ({ row }) => (
          <span className="text-xs text-awn-text-secondary max-w-md truncate block">
            {row.original.description || '—'}
          </span>
        ),
      },
      {
        id: 'createdDate',
        accessorKey: 'createdDate',
        header: () => (isRtl ? 'تاريخ الإنشاء' : 'Created Date'),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-awn-text-secondary tabular-nums">
            {row.original.createdDate}
          </span>
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
        id: 'actions',
        header: () => (
          <span className="block text-right rtl:text-left">
            {isRtl ? 'الإجراءات' : 'Actions'}
          </span>
        ),
        cell: ({ row }) => {
          const assetType = row.original;
          const isActive = assetType.status === 'Active';
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => handleOpenTypeDetails(assetType)}
                title={`View ${assetType.typeName}`}
                aria-label={`View ${assetType.typeName}`}
                className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-primary-soft transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenEditModal(assetType)}
                title={`Edit ${assetType.typeName}`}
                aria-label={`Edit ${assetType.typeName}`}
                className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-primary-soft transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {isActive && (
                <button
                  type="button"
                  onClick={() => setDeactivateTarget(assetType)}
                  title={`Deactivate ${assetType.typeName}`}
                  aria-label={`Deactivate ${assetType.typeName}`}
                  className="p-1.5 rounded text-awn-text-secondary hover:text-awn-warning hover:bg-awn-warning-soft transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeleteTarget(assetType)}
                title={`Delete ${assetType.typeName}`}
                aria-label={`Delete ${assetType.typeName}`}
                className="p-1.5 rounded text-awn-text-secondary hover:text-awn-error hover:bg-awn-error-soft transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [isRtl]
  );

  return (
    <div className="space-y-5">
      {/* Page Header with exact Title, Description, and Actions ("Export CSV", "New Type") */}
      <PageHeader
        title={isRtl ? 'أنواع الأصول' : 'Asset Types'}
        description={
          isRtl
            ? 'تصنيف الأصول بحسب النوع الفني والمواصفات (مثل الأجهزة، المركبات، الآلات، والأثاث المكتبي) لتوحيد تتبع الصيانة والتقارير الرقابية.'
            : 'Classify your assets based on type, such as Electronics, Vehicles, Machinery, or Office Equipment. This helps in better asset tracking, maintenance, and reporting.'
        }
        contextMeta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-awn-text-secondary tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-semibold text-awn-text-primary">
              <Layers className="w-3.5 h-3.5 text-awn-primary" aria-hidden="true" />
              <span>
                {isRtl
                  ? `${formatNumber(typesData.totalRecordsCount)} أنواع أصول`
                  : typesData.summaryTotalLabel}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(typesData.activeCount)}
              </strong>{' '}
              {isRtl ? 'نشط' : 'Active'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(typesData.inactiveCount)}
              </strong>{' '}
              {isRtl ? 'غير نشط' : 'Inactive'}
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
            {isRtl ? 'تصدير CSV' : 'Export CSV'}
          </Button>
        }
        primaryAction={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreateModal}
          >
            {isRtl ? 'إضافة نوع' : 'New Type'}
          </Button>
        }
      />

      {/* Main Asset Types Table */}
      <DataTable
        title={isRtl ? 'أنواع الأصول' : 'Asset Types'}
        columns={columns}
        data={typesData.items}
        count={typesData.pagination.totalItems}
        loading={loading}
        pageIndex={currentPage - 1}
        pageSize={pageSize}
        onPageChange={(newPageIndex) => {
          const next = newPageIndex + 1;
          setCurrentPage(next);
          fetchTypes(next);
        }}
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder={
          isRtl
            ? 'البحث برمز النوع، الاسم، التصنيف، الوصف...'
            : 'Search by Type ID, Type Name, Category, Description...'
        }
        onAddNew={handleOpenCreateModal}
        onExport={handleExportCsv}
      />

      {/* ========================================================================
          TYPE DETAILS DRAWER (Section 6)
          ======================================================================== */}
      <Drawer
        isOpen={detailsOpen && Boolean(selectedType)}
        onClose={() => setDetailsOpen(false)}
        title={
          selectedType
            ? `${selectedType.typeId} · ${selectedType.typeName}`
            : 'Type Details'
        }
        subtitle="Master · Asset Type Specification"
        size="lg"
        footer={
          selectedType ? (
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {selectedType.status === 'Active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Ban className="w-3.5 h-3.5" />}
                    onClick={() => setDeactivateTarget(selectedType)}
                  >
                    Deactivate Type
                  </Button>
                )}
                <Button
                  variant="dangerOutline"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => setDeleteTarget(selectedType)}
                >
                  Delete Type
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Pencil className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenEditModal(selectedType)}
                >
                  Edit Type
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {selectedType && (
          <div className="space-y-6">
            {/* Type Summary Banner */}
            <div className="p-4 rounded-lg bg-awn-surface-alt border border-awn-border flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-awn-text-muted tabular-nums">
                  {selectedType.typeId}
                </div>
                <div className="text-base font-semibold text-awn-text-primary mt-0.5">
                  {selectedType.typeName}
                </div>
                <div className="text-xs text-awn-text-secondary mt-1">
                  Created Date: {selectedType.createdDate}
                </div>
              </div>
              <StatusBadge
                label={selectedType.status}
                tone={selectedType.statusTone}
              />
            </div>

            {/* Type Details Attributes */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-awn-text-primary">
                Type Details
              </h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Type ID</dt>
                  <dd className="font-mono font-semibold text-awn-text-primary mt-1 tabular-nums">
                    {selectedType.typeId}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Type Name</dt>
                  <dd className="font-semibold text-awn-text-primary mt-1">
                    {selectedType.typeName}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Category</dt>
                  <dd className="font-medium text-awn-text-primary mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-awn-surface-alt border border-awn-border text-awn-text-primary">
                      {selectedType.category}
                    </span>
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge
                      label={selectedType.status}
                      tone={selectedType.statusTone}
                    />
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Created Date</dt>
                  <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                    {selectedType.createdDate}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Language</dt>
                  <dd className="font-medium text-awn-text-primary mt-1">
                    {selectedType.language || 'English'}
                  </dd>
                </div>
                <div className="sm:col-span-2 p-3.5 rounded-md border border-awn-border bg-awn-surface-alt">
                  <dt className="text-awn-text-muted">Description</dt>
                  <dd className="font-medium text-awn-text-primary mt-1 leading-relaxed">
                    {selectedType.description || 'No description provided.'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================================
          CREATE NEW ASSET TYPE / EDIT TYPE MODAL (Sections 7, 8, 9, 10)
          ======================================================================== */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={
          formMode === 'create' ? 'Create New Asset Type' : 'Edit Type'
        }
        description={
          formMode === 'create'
            ? 'Define a new master asset type. Type ID is autogenerated by the system.'
            : `Update the name, category, and description for type ${formData.typeId}.`
        }
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setFormModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleFormSubmit}
              loading={submitting}
            >
              Submit
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} noValidate>
          <FormSection
            title="Type Information"
            description="Enter the asset type details below."
            columns={1}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Type ID"
                value={formData.typeId}
                disabled
                readOnly
                description="Autogenerated"
              />
              <Select
                label="English"
                options={LANGUAGE_OPTIONS}
                value={formData.language}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, language: e.target.value }))
                }
              />
            </div>

            <Input
              label="Type Name"
              required
              placeholder="e.g., Laptop"
              value={formData.typeName}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({ ...prev, typeName: val }));
                if (formErrors.typeName) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.typeName;
                    return next;
                  });
                }
              }}
              error={formErrors.typeName}
            />

            <Select
              label="Asset Category"
              required
              options={categorySelectOptions}
              value={formData.category}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({ ...prev, category: val }));
                if (formErrors.category) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.category;
                    return next;
                  });
                }
              }}
              error={formErrors.category}
            />

            <Textarea
              label="Description"
              rows={3}
              placeholder="e.g., Portable computer for office work"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </FormSection>
        </form>
      </Modal>

      {/* ========================================================================
          DEACTIVATE TYPE CONFIRMATION DIALOG (Section 11)
          ======================================================================== */}
      <ConfirmDialog
        isOpen={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Type"
        description="Confirming this action will change the asset type status from Active to Inactive. The type record will remain preserved in the master dataset."
        itemSummary={
          deactivateTarget
            ? `${deactivateTarget.typeId} — ${deactivateTarget.typeName} (${deactivateTarget.category})`
            : ''
        }
        confirmLabel="Deactivate Type"
        loading={submitting}
      />

      {/* ========================================================================
          DELETE TYPE CONFIRMATION DIALOG (Section 12)
          ======================================================================== */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Type"
        description="Are you sure you want to delete this asset type? This action will remove the type from the Asset Types dataset."
        itemSummary={
          deleteTarget
            ? `${deleteTarget.typeId} — ${deleteTarget.typeName} (${deleteTarget.category})`
            : ''
        }
        confirmLabel="Delete Type"
        loading={submitting}
      />
    </div>
  );
}
