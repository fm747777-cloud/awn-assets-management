import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Download,
  Eye,
  Pencil,
  Plus,
  Tag,
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
  AssetTag,
  AssetTagFormData,
  AssetTagsQueryResponse,
  SelectOption,
  ValidationErrors,
} from '../types/index.ts';

const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: 'English', label: 'English' },
  { value: 'Arabic (العربية)', label: 'Arabic (العربية)' },
  { value: 'Bilingual (EN / AR)', label: 'Bilingual (EN / AR)' },
];

export default function AssetTagsPage() {
  const { showToast } = useToast();
  const { isRtl, formatNumber } = useLanguage();

  // Table & Query State
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [tagsData, setTagsData] = useState<AssetTagsQueryResponse>({
    items: [],
    allMatchingItems: [],
    summaryTotalLabel: '18 Asset Tags',
    totalRecordsCount: 5,
    activeCount: 4,
    inactiveCount: 1,
    pagination: { page: 1, pageSize: 8, totalItems: 0, totalPages: 1 },
  });

  // Details Drawer State
  const [selectedTag, setSelectedTag] = useState<AssetTag | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Create / Edit Form Modal State (reusing the same form structure)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<AssetTagFormData>({
    tagId: 'TAG-006',
    language: 'English',
    tagName: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Deactivate Confirmation Dialog State
  const [deactivateTarget, setDeactivateTarget] = useState<AssetTag | null>(null);

  // Delete Confirmation Dialog State
  const [deleteTarget, setDeleteTarget] = useState<AssetTag | null>(null);

  const fetchTags = useCallback(
    async (targetPage = currentPage) => {
      setLoading(true);
      try {
        const response = await assetModuleService.getAssetTags({
          search: searchQuery,
          page: targetPage,
          pageSize,
        });
        setTagsData(response);
        setCurrentPage(response.pagination.page);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, currentPage]
  );

  useEffect(() => {
    fetchTags(1);
  }, [searchQuery]);

  // ============================================================================
  // DETAILS HANDLERS
  // ============================================================================
  const handleOpenTagDetails = (assetTag: AssetTag) => {
    setSelectedTag(assetTag);
    setDetailsOpen(true);
  };

  // ============================================================================
  // CREATE / EDIT FORM HANDLERS (Reusing Single Form Implementation)
  // ============================================================================
  const handleOpenCreateModal = () => {
    const nextId = assetModuleService.generateNextTagId();
    setFormMode('create');
    setFormData({
      tagId: nextId,
      language: 'English',
      tagName: '',
      description: '',
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (assetTag: AssetTag) => {
    setFormMode('edit');
    setFormData({
      tagId: assetTag.tagId,
      language: assetTag.language || 'English',
      tagName: assetTag.tagName,
      description: assetTag.description,
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const validateTagForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!formData.tagName.trim()) {
      errors.tagName = 'Tag Name is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateTagForm()) return;

    setSubmitting(true);
    try {
      if (formMode === 'create') {
        const created = await assetModuleService.createAssetTag({
          tagId: formData.tagId,
          language: formData.language,
          tagName: formData.tagName,
          description: formData.description,
        });
        setFormModalOpen(false);
        setSelectedTag(created);
        await fetchTags(1);
        showToast({
          title: `Asset Tag ${created.tagId} Created`,
          description: `"${created.tagName}" has been added to Asset Tags.`,
          variant: 'success',
        });
      } else {
        const updated = await assetModuleService.updateAssetTag(
          formData.tagId,
          {
            language: formData.language,
            tagName: formData.tagName,
            description: formData.description,
          }
        );
        setFormModalOpen(false);
        if (selectedTag?.tagId === updated.tagId) {
          setSelectedTag(updated);
        }
        await fetchTags(currentPage);
        showToast({
          title: `Asset Tag ${updated.tagId} Updated`,
          description: `Changes to "${updated.tagName}" have been saved.`,
          variant: 'success',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // DEACTIVATE TAG HANDLERS
  // ============================================================================
  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setSubmitting(true);
    try {
      const updated = await assetModuleService.deactivateAssetTag(
        deactivateTarget.tagId
      );
      if (selectedTag?.tagId === updated.tagId) {
        setSelectedTag(updated);
      }
      setDeactivateTarget(null);
      await fetchTags(currentPage);
      showToast({
        title: `Asset Tag ${updated.tagId} Deactivated`,
        description: `"${updated.tagName}" is now marked as Inactive.`,
        variant: 'info',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // DELETE TAG HANDLERS
  // ============================================================================
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const targetId = deleteTarget.tagId;
      const targetName = deleteTarget.tagName;
      await assetModuleService.deleteAssetTag(targetId);

      if (selectedTag?.tagId === targetId) {
        setDetailsOpen(false);
        setSelectedTag(null);
      }
      setDeleteTarget(null);
      await fetchTags(currentPage);
      showToast({
        title: `Asset Tag ${targetId} Deleted`,
        description: `"${targetName}" has been removed from Asset Tags.`,
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
    const recordsToExport = tagsData.allMatchingItems;
    if (!recordsToExport || recordsToExport.length === 0) {
      showToast({
        title: 'No tags to export',
        description: 'Adjust your search filter before exporting to CSV.',
        variant: 'warning',
      });
      return;
    }

    const csvContent = assetModuleService.exportAssetTagsCsv(recordsToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `AWN_Asset_Tags_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      title: 'Exported Asset Tags CSV',
      description: `${recordsToExport.length} tag record(s) exported to AWN_Asset_Tags_${today}.csv.`,
      variant: 'success',
    });
  };

  const columns = useMemo<ColumnDef<typeof dataTableFeatures, AssetTag>[]>(
    () => [
      {
        id: 'tagId',
        accessorKey: 'tagId',
        header: () => (isRtl ? 'رمز الوسم' : 'Tag ID'),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => handleOpenTagDetails(row.original)}
            className="font-mono text-xs font-semibold text-awn-primary hover:underline tabular-nums cursor-pointer"
          >
            {row.original.tagId}
          </button>
        ),
      },
      {
        id: 'tagName',
        accessorKey: 'tagName',
        header: () => (isRtl ? 'اسم الوسم' : 'Tag Name'),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => handleOpenTagDetails(row.original)}
            className="font-medium text-awn-text-primary hover:text-awn-primary text-left rtl:text-right transition-colors cursor-pointer"
          >
            {row.original.tagName}
          </button>
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
          const assetTag = row.original;
          const isActive = assetTag.status === 'Active';
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => handleOpenTagDetails(assetTag)}
                title={`View ${assetTag.tagName}`}
                aria-label={`View ${assetTag.tagName}`}
                className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-primary-soft transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenEditModal(assetTag)}
                title={`Edit ${assetTag.tagName}`}
                aria-label={`Edit ${assetTag.tagName}`}
                className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-primary-soft transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {isActive && (
                <button
                  type="button"
                  onClick={() => setDeactivateTarget(assetTag)}
                  title={`Deactivate ${assetTag.tagName}`}
                  aria-label={`Deactivate ${assetTag.tagName}`}
                  className="p-1.5 rounded text-awn-text-secondary hover:text-awn-warning hover:bg-awn-warning-soft transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeleteTarget(assetTag)}
                title={`Delete ${assetTag.tagName}`}
                aria-label={`Delete ${assetTag.tagName}`}
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
      {/* Page Header with exact Title, Description, and Actions ("Export CSV", "New Tag") */}
      <PageHeader
        title={isRtl ? 'وسوم الأصول' : 'Asset Tags'}
        description={
          isRtl
            ? 'وسوم تشغيلية لتسهيل ربط الأصول بمراكز التكلفة والمشاريع والأغراض الرقابية، وتنظيم الجرد الميداني.'
            : 'Assign specific tags to assets for easier categorization, quick filtering, and efficient tracking. Tags help in organizing large inventories by function, location, or status.'
        }
        contextMeta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-awn-text-secondary tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-semibold text-awn-text-primary">
              <Tag className="w-3.5 h-3.5 text-awn-primary" aria-hidden="true" />
              <span>
                {isRtl
                  ? `${formatNumber(tagsData.totalRecordsCount)} وسوم أصول`
                  : tagsData.summaryTotalLabel}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(tagsData.activeCount)}
              </strong>{' '}
              {isRtl ? 'نشط' : 'Active'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(tagsData.inactiveCount)}
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
            {isRtl ? 'إضافة وسم' : 'New Tag'}
          </Button>
        }
      />

      {/* Main Asset Tags Table */}
      <DataTable
        title={isRtl ? 'وسوم الأصول' : 'Asset Tags'}
        columns={columns}
        data={tagsData.items}
        count={tagsData.pagination.totalItems}
        loading={loading}
        pageIndex={currentPage - 1}
        pageSize={pageSize}
        onPageChange={(newPageIndex) => {
          const next = newPageIndex + 1;
          setCurrentPage(next);
          fetchTags(next);
        }}
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder={
          isRtl
            ? 'البحث برمز الوسم، الاسم، الوصف...'
            : 'Search by Tag ID, Tag Name, Description...'
        }
        onAddNew={handleOpenCreateModal}
        onExport={handleExportCsv}
      />

      {/* ========================================================================
          TAG DETAILS DRAWER (Section 8)
          ======================================================================== */}
      <Drawer
        isOpen={detailsOpen && Boolean(selectedTag)}
        onClose={() => setDetailsOpen(false)}
        title={
          selectedTag
            ? `${selectedTag.tagId} · ${selectedTag.tagName}`
            : 'Tag Details'
        }
        subtitle="Master · Asset Tag Specification"
        size="lg"
        footer={
          selectedTag ? (
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {selectedTag.status === 'Active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Ban className="w-3.5 h-3.5" />}
                    onClick={() => setDeactivateTarget(selectedTag)}
                  >
                    Deactivate Tag
                  </Button>
                )}
                <Button
                  variant="dangerOutline"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => setDeleteTarget(selectedTag)}
                >
                  Delete Tag
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
                  onClick={() => handleOpenEditModal(selectedTag)}
                >
                  Edit Tag
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {selectedTag && (
          <div className="space-y-6">
            {/* Tag Summary Banner */}
            <div className="p-4 rounded-lg bg-awn-surface-alt border border-awn-border flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-awn-text-muted tabular-nums">
                  {selectedTag.tagId}
                </div>
                <div className="text-base font-semibold text-awn-text-primary mt-0.5">
                  {selectedTag.tagName}
                </div>
                <div className="text-xs text-awn-text-secondary mt-1">
                  Created Date: {selectedTag.createdDate}
                </div>
              </div>
              <StatusBadge
                label={selectedTag.status}
                tone={selectedTag.statusTone}
              />
            </div>

            {/* Tag Details Attributes */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-awn-text-primary">
                Tag Details
              </h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Tag ID</dt>
                  <dd className="font-mono font-semibold text-awn-text-primary mt-1 tabular-nums">
                    {selectedTag.tagId}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Tag Name</dt>
                  <dd className="font-semibold text-awn-text-primary mt-1">
                    {selectedTag.tagName}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge
                      label={selectedTag.status}
                      tone={selectedTag.statusTone}
                    />
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Created Date</dt>
                  <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                    {selectedTag.createdDate}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Language</dt>
                  <dd className="font-medium text-awn-text-primary mt-1">
                    {selectedTag.language || 'English'}
                  </dd>
                </div>
                <div className="sm:col-span-2 p-3.5 rounded-md border border-awn-border bg-awn-surface-alt">
                  <dt className="text-awn-text-muted">Description</dt>
                  <dd className="font-medium text-awn-text-primary mt-1 leading-relaxed">
                    {selectedTag.description || 'No description provided.'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================================
          CREATE NEW ASSET TAG / EDIT TAG MODAL (Sections 9, 10, 11)
          ======================================================================== */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={
          formMode === 'create' ? 'Create New Asset Tag' : 'Edit Tag'
        }
        description={
          formMode === 'create'
            ? 'Define a new master asset tag. Tag ID is autogenerated by the system.'
            : `Update the name and description for tag ${formData.tagId}.`
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
            title="Tag Information"
            description="Enter the asset tag details below."
            columns={1}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tag ID"
                value={formData.tagId}
                disabled
                readOnly
                description="Autogenerated"
              />
              <Select
                label="Language"
                options={LANGUAGE_OPTIONS}
                value={formData.language}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, language: e.target.value }))
                }
              />
            </div>

            <Input
              label="Tag Name *"
              required
              placeholder="e.g., IT Equipment"
              value={formData.tagName}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({ ...prev, tagName: val }));
                if (formErrors.tagName) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.tagName;
                    return next;
                  });
                }
              }}
              error={formErrors.tagName}
            />

            <Textarea
              label="Description"
              rows={3}
              placeholder="e.g., Assets used for IT and networking"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </FormSection>
        </form>
      </Modal>

      {/* ========================================================================
          DEACTIVATE TAG CONFIRMATION DIALOG (Section 12)
          ======================================================================== */}
      <ConfirmDialog
        isOpen={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Tag"
        description="Confirming this action will change the asset tag status from Active to Inactive. The tag record will remain preserved in the master dataset."
        itemSummary={
          deactivateTarget
            ? `${deactivateTarget.tagId} — ${deactivateTarget.tagName}`
            : ''
        }
        confirmLabel="Deactivate Tag"
        loading={submitting}
      />

      {/* ========================================================================
          DELETE TAG CONFIRMATION DIALOG (Section 13)
          ======================================================================== */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Tag"
        description="Are you sure you want to delete this asset tag? This action will remove the tag from the Asset Tags dataset."
        itemSummary={
          deleteTarget
            ? `${deleteTarget.tagId} — ${deleteTarget.tagName}`
            : ''
        }
        confirmLabel="Delete Tag"
        loading={submitting}
      />
    </div>
  );
}
