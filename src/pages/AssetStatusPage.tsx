import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
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
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { TableSkeleton } from '../components/ui/LoadingState.tsx';
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

export default function AssetStatusPage() {
  const { showToast } = useToast();

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

  return (
    <div className="space-y-5">
      {/* Page Header with exact Title, Description, and Actions ("Export CSV", "New Status") */}
      <PageHeader
        title="Asset Status"
        description="Manage and update all your assets in one place."
        contextMeta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-awn-text-secondary tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-semibold text-awn-text-primary">
              <Activity className="w-3.5 h-3.5 text-awn-primary" aria-hidden="true" />
              <span>{statusesData.summaryTotalLabel}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {statusesData.activeCount}
              </strong>{' '}
              Active
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {statusesData.deactivatedCount}
              </strong>{' '}
              Deactivated
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
            Export CSV
          </Button>
        }
        primaryAction={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreateModal}
          >
            New Status
          </Button>
        }
      />

      {/* Main Asset Status Table Container */}
      <div className="bg-awn-surface border border-awn-border rounded-lg overflow-hidden">
        {/* Search & Summary Toolbar */}
        <div className="p-4 border-b border-awn-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by Status Code, Tags Name, Author, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              leftIcon={<Search className="w-4 h-4" />}
              aria-label="Search asset status"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-awn-text-secondary">
            <span className="px-2.5 py-1 rounded-md bg-awn-surface-alt border border-awn-border font-semibold text-awn-text-primary tabular-nums">
              {statusesData.summaryTotalLabel}
            </span>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : statusesData.items.length === 0 ? (
          <EmptyState
            title="No Asset Statuses Found"
            description={
              searchQuery
                ? `No asset status matched "${searchQuery}". Try clearing your search query.`
                : 'No asset statuses are currently registered. Click "New Status" to create your first status.'
            }
            primaryActionLabel={searchQuery ? 'Clear Search' : 'New Status'}
            onPrimaryAction={
              searchQuery ? () => setSearchQuery('') : handleOpenCreateModal
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-awn-surface-alt border-b border-awn-border text-xs font-semibold text-awn-text-secondary">
                    <th className="py-3 px-4 whitespace-nowrap">Status Code</th>
                    <th className="py-3 px-4 whitespace-nowrap">Tags Name</th>
                    <th className="py-3 px-4 whitespace-nowrap">Author/Creator</th>
                    <th className="py-3 px-4 whitespace-nowrap">Created Date</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-awn-border text-sm">
                  {statusesData.items.map((assetStatus) => {
                    const isActive = assetStatus.status === 'Active';
                    return (
                      <tr
                        key={assetStatus.statusCode}
                        className="hover:bg-awn-surface-alt transition-colors group"
                      >
                        {/* Status Code */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenStatusDetails(assetStatus)}
                            className="font-mono text-xs font-semibold text-awn-primary hover:underline tabular-nums cursor-pointer"
                          >
                            {assetStatus.statusCode}
                          </button>
                        </td>

                        {/* Tags Name (Exact wording preserved) */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenStatusDetails(assetStatus)}
                            className="font-medium text-awn-text-primary hover:text-awn-primary text-left transition-colors cursor-pointer"
                          >
                            {assetStatus.statusName}
                          </button>
                        </td>

                        {/* Author/Creator */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="text-xs">
                            <span className="font-medium text-awn-text-primary block">
                              {assetStatus.authorName}
                            </span>
                            <span className="text-awn-text-secondary font-mono text-[11px] block">
                              {assetStatus.authorEmail}
                            </span>
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap font-mono text-xs text-awn-text-secondary tabular-nums">
                          {assetStatus.createdDate}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <StatusBadge
                            label={assetStatus.status}
                            tone={assetStatus.statusTone}
                          />
                        </td>

                        {/* Row Actions */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenStatusDetails(assetStatus)}
                              title={`View ${assetStatus.statusName}`}
                              aria-label={`View ${assetStatus.statusName}`}
                              className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-primary-soft transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(assetStatus)}
                              title={`Edit ${assetStatus.statusName}`}
                              aria-label={`Edit ${assetStatus.statusName}`}
                              className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-primary-soft transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {isActive && (
                              <button
                                type="button"
                                onClick={() => setDeactivateTarget(assetStatus)}
                                title={`Delete Request Status (${assetStatus.statusName})`}
                                aria-label={`Delete Request Status (${assetStatus.statusName})`}
                                className="p-1.5 rounded text-awn-text-secondary hover:text-awn-warning hover:bg-awn-warning-soft transition-colors cursor-pointer"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(assetStatus)}
                              title={`Delete ${assetStatus.statusName}`}
                              aria-label={`Delete ${assetStatus.statusName}`}
                              className="p-1.5 rounded text-awn-text-secondary hover:text-awn-error hover:bg-awn-error-soft transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-3 border-t border-awn-border bg-awn-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-awn-text-secondary">
              <div className="tabular-nums">
                Showing{' '}
                <strong className="font-semibold text-awn-text-primary">
                  {statusesData.items.length}
                </strong>{' '}
                of{' '}
                <strong className="font-semibold text-awn-text-primary">
                  {statusesData.pagination.totalItems}
                </strong>{' '}
                displayed records ·{' '}
                <strong className="font-semibold text-awn-text-primary">
                  {statusesData.summaryTotalLabel}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => fetchStatuses(currentPage - 1)}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <span className="px-2.5 py-1 font-mono text-xs text-awn-text-primary tabular-nums">
                  Page {currentPage} of {statusesData.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= statusesData.pagination.totalPages}
                  onClick={() => fetchStatuses(currentPage + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========================================================================
          STATUS DETAILS DRAWER (Sections 10, 11)
          ======================================================================== */}
      <Drawer
        isOpen={detailsOpen && Boolean(selectedStatus)}
        onClose={() => setDetailsOpen(false)}
        title={
          selectedStatus
            ? `${selectedStatus.statusCode} · ${selectedStatus.statusName}`
            : 'View & Edit Status'
        }
        subtitle="Master · Asset Status Specification"
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
                    Delete Request Status
                  </Button>
                )}
                <Button
                  variant="dangerOutline"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => setDeleteTarget(selectedStatus)}
                >
                  Delete Status
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
                  onClick={() => handleOpenEditModal(selectedStatus)}
                >
                  Edit Status
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
                  {selectedStatus.statusName}
                </div>
                <div className="text-xs text-awn-text-secondary mt-1">
                  Created Date: {selectedStatus.createdDate}
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
                Status Details
              </h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Status Code</dt>
                  <dd className="font-mono font-semibold text-awn-text-primary mt-1 tabular-nums">
                    {selectedStatus.statusCode}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Tags Name</dt>
                  <dd className="font-semibold text-awn-text-primary mt-1">
                    {selectedStatus.statusName}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Language</dt>
                  <dd className="font-medium text-awn-text-primary mt-1">
                    {selectedStatus.language || 'English'}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge
                      label={selectedStatus.status}
                      tone={selectedStatus.statusTone}
                    />
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Author/Creator</dt>
                  <dd className="font-medium text-awn-text-primary mt-1">
                    {selectedStatus.authorName}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Email</dt>
                  <dd className="font-mono text-awn-text-primary mt-1 break-all">
                    {selectedStatus.authorEmail}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Created Date</dt>
                  <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                    {selectedStatus.createdDate}
                  </dd>
                </div>
                <div className="sm:col-span-2 p-3.5 rounded-md border border-awn-border bg-awn-surface-alt">
                  <dt className="text-awn-text-muted">Description</dt>
                  <dd className="font-medium text-awn-text-primary mt-1 leading-relaxed">
                    {selectedStatus.description || 'No description provided.'}
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
          formMode === 'create' ? 'Create New Status' : 'Edit Status'
        }
        description={
          formMode === 'create'
            ? 'Define a new master asset status. Status Code is autogenerated by the system.'
            : `Update the name and description for status ${formData.statusCode}.`
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
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setFormModalOpen(false)}
                disabled={submitting}
              >
                Discard Changes
              </Button>
              <Button
                variant="primary"
                onClick={handleFormSubmit}
                loading={submitting}
              >
                Save & Update
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleFormSubmit} noValidate>
          <FormSection
            title="Status Information"
            description="Enter the status details below."
            columns={1}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Status Code"
                value={formData.statusCode}
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

            {/* Preserving exact visible wording: Status Name * with placeholder Enter Tag Name */}
            <Input
              label="Status Name *"
              required
              placeholder="Enter Tag Name"
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
              error={formErrors.statusName}
            />

            <Textarea
              label="Description"
              rows={3}
              placeholder="Enter status description..."
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
        title="Deactivate Status"
        description="Confirming this action will change the asset status from Active to Deactivated. The status record will remain preserved in the master dataset."
        itemSummary={
          deactivateTarget
            ? `${deactivateTarget.statusCode} — ${deactivateTarget.statusName}`
            : ''
        }
        confirmLabel="Delete Request Status"
        loading={submitting}
      />

      {/* ========================================================================
          DELETE STATUS CONFIRMATION DIALOG (Section 17)
          ======================================================================== */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Status"
        description="Are you sure you want to delete this asset status? This action will remove the status from the Asset Status dataset."
        itemSummary={
          deleteTarget
            ? `${deleteTarget.statusCode} — ${deleteTarget.statusName}`
            : ''
        }
        confirmLabel="Delete Status"
        loading={submitting}
      />
    </div>
  );
}
