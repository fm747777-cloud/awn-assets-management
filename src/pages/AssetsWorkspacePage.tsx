import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
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
  Asset,
  AssetClassification,
  AssetEditFormValues,
  AssetReassignFormValues,
  AssetReassignPayload,
  AssetsQueryResponse,
} from '../types/asset.ts';
import type { ValidationErrors } from '../types/common.ts';
import type { TableFilterTab } from '../types/ui.ts';

const CLASSIFICATION_TABS: TableFilterTab<'ALL' | AssetClassification>[] = [
  { id: 'ALL', label: 'All Assets' },
  { id: 'Compliance', label: 'Compliance' },
  { id: 'Non-Compliance', label: 'Non-Compliance' },
];

const STATUS_TABS: TableFilterTab[] = [
  { id: 'ALL', label: 'All Statuses' },
  { id: 'Assigned', label: 'Assigned' },
  { id: 'Available', label: 'Available' },
  { id: 'Compliance Due', label: 'Compliance Due' },
  { id: 'In Maintenance', label: 'In Maintenance' },
  { id: 'Retired', label: 'Retired' },
];

export interface AssetsWorkspacePageProps {
  onNavigate: (path: string) => void;
}

export default function AssetsWorkspacePage({ onNavigate }: AssetsWorkspacePageProps) {
  const { showToast } = useToast();
  const selectOptions = assetModuleService.getSelectOptions();
  const employees = assetModuleService.getEmployeeDirectory();

  // Workspace Table State
  const [assetsData, setAssetsData] = useState<AssetsQueryResponse>({
    items: [],
    allMatchingItems: [],
    summaryCounts: {
      total: 0,
      compliance: 0,
      nonCompliance: 0,
      assigned: 0,
      available: 0,
      attention: 0,
      retired: 0,
    },
    pagination: { page: 1, pageSize: 8, totalItems: 0, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);

  // Integrated Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<'ALL' | AssetClassification>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Interactive Flows State
  const [newAssetModalOpen, setNewAssetModalOpen] = useState(false);
  const [selectedNewType, setSelectedNewType] = useState<AssetClassification>('Compliance');

  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | null>(null); // 'view' | 'edit' | null
  const [reassignTarget, setReassignTarget] = useState<Asset | null>(null);
  const [retireTarget, setRetireTarget] = useState<Asset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState<AssetEditFormValues>({
    name: '',
    category: 'Devices',
    type: '',
    classification: 'Non-Compliance',
    serialNumber: '',
    status: 'Assigned',
    location: '',
    notes: '',
  });
  const [editErrors, setEditErrors] = useState<ValidationErrors<keyof AssetEditFormValues>>({});

  // Reassign Form State
  const [reassignForm, setReassignForm] = useState<AssetReassignFormValues>({
    mode: 'assign', // 'assign' | 'unassign'
    employeeName: '',
    assignedRole: '',
    department: '',
    location: '',
    notes: '',
  });
  const [reassignError, setReassignError] = useState('');

  // Retire Reason State
  const [retireReason, setRetireReason] = useState('');

  const fetchAssets = useCallback(
    async (pageToLoad = currentPage) => {
      setLoading(true);
      try {
        const res = await assetModuleService.getAssets({
          search: searchQuery,
          classification: classificationFilter,
          category: categoryFilter,
          status: statusFilter,
          page: pageToLoad,
          pageSize: 8,
        });
        setAssetsData(res);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, classificationFilter, categoryFilter, statusFilter, currentPage]
  );

  useEffect(() => {
    fetchAssets(currentPage);
  }, [fetchAssets, currentPage]);

  // ============================================================================
  // EXPORT CSV HANDLER (Frontend Mock Data -> RFC-4180 CSV Download)
  // ============================================================================
  const handleExportCsv = () => {
    const recordsToExport = assetsData.allMatchingItems || assetsData.items || [];
    if (recordsToExport.length === 0) {
      showToast({
        title: 'No assets to export',
        description: 'Adjust your search or filter criteria before exporting.',
        variant: 'warning',
      });
      return;
    }

    const csvContent = assetModuleService.generateAssetsCsv(recordsToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AWN_Assets_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      title: 'Export CSV completed',
      description: `Exported ${recordsToExport.length} asset records to CSV.`,
      variant: 'success',
    });
  };

  // ============================================================================
  // ASSET ACTIONS: VIEW, EDIT, REASSIGN, RETIRE / DEACTIVATE
  // ============================================================================
  const handleOpenView = (asset: Asset) => {
    setActiveAsset(asset);
    setDrawerMode('view');
  };

  const handleOpenEdit = (asset: Asset) => {
    setActiveAsset(asset);
    setEditForm({
      name: asset.name || '',
      category: asset.category || 'Devices',
      type: asset.type || '',
      classification: asset.classification || 'Non-Compliance',
      serialNumber: asset.serialNumber || '',
      status: asset.status || 'Assigned',
      location: asset.location || 'Riyadh HQ · Floor 14',
      notes: asset.notes || '',
    });
    setEditErrors({});
    setDrawerMode('edit');
  };

  const handleSaveEdit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!activeAsset) return;
    const errors: ValidationErrors<keyof AssetEditFormValues> = {};
    if (!editForm.name || editForm.name.trim().length < 3) {
      errors.name = 'Asset name is required (minimum 3 characters).';
    }
    if (!editForm.type || editForm.type.trim().length < 2) {
      errors.type = 'Asset type specification is required.';
    }
    if (!editForm.serialNumber || editForm.serialNumber.trim().length < 3) {
      errors.serialNumber = 'Serial number or license key is required.';
    }
    setEditErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const updated = await assetModuleService.updateAsset(activeAsset.id, editForm);
      setActiveAsset(updated);
      setDrawerMode('view');
      await fetchAssets(currentPage);
      showToast({
        title: `Asset ${updated.code} updated`,
        description: `Changes to "${updated.name}" have been saved.`,
        variant: 'success',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReassign = (asset: Asset) => {
    setReassignTarget(asset);
    setReassignError('');
    const defaultEmp =
      employees.find((emp) => emp.name === asset.assignedTo) || employees[0];

    setReassignForm({
      mode: 'assign',
      employeeName: asset.assignedTo || defaultEmp.name,
      assignedRole: asset.assignedRole || defaultEmp.role,
      department: asset.department || defaultEmp.department,
      location: asset.location || defaultEmp.location,
      notes: '',
    });
  };

  const handleSelectEmployeePreset = (empName: string) => {
    const match = employees.find((e) => e.name === empName);
    if (match) {
      setReassignForm((prev) => ({
        ...prev,
        employeeName: match.name,
        assignedRole: match.role,
        department: match.department,
        location: match.location,
      }));
      setReassignError('');
    } else {
      setReassignForm((prev) => ({ ...prev, employeeName: empName }));
    }
  };

  const handleConfirmReassign = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!reassignTarget) return;

    if (reassignForm.mode === 'assign' && !reassignForm.employeeName.trim()) {
      setReassignError('Please select or enter an employee to assign this asset.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: AssetReassignPayload =
        reassignForm.mode === 'unassign'
          ? {
              assignedTo: null,
              assignedRole: null,
              department: 'IT / Facility Depot Pool',
              location: reassignForm.location,
              notes: reassignForm.notes || 'Returned to available inventory pool.',
            }
          : {
              assignedTo: reassignForm.employeeName,
              assignedRole: reassignForm.assignedRole,
              department: reassignForm.department,
              location: reassignForm.location,
              notes: reassignForm.notes,
            };

      const updated = await assetModuleService.reassignAsset(reassignTarget.id, payload);
      if (activeAsset?.id === updated.id) {
        setActiveAsset(updated);
      }
      setReassignTarget(null);
      await fetchAssets(currentPage);

      showToast({
        title:
          reassignForm.mode === 'unassign'
            ? `Asset ${updated.code} unassigned`
            : `Asset ${updated.code} assigned`,
        description:
          reassignForm.mode === 'unassign'
            ? `"${updated.name}" is now marked Available in the inventory pool.`
            : `"${updated.name}" is now assigned to ${updated.assignedTo} (${updated.department}).`,
        variant: 'success',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRetire = (asset: Asset) => {
    setRetireTarget(asset);
    setRetireReason('');
  };

  const handleConfirmRetire = async () => {
    if (!retireTarget) return;
    setSubmitting(true);
    try {
      const updated = await assetModuleService.retireAsset(retireTarget.id, {
        reason: retireReason,
      });
      if (activeAsset?.id === updated.id) {
        setActiveAsset(updated);
      }
      setRetireTarget(null);
      await fetchAssets(currentPage);
      showToast({
        title: `Asset ${updated.code} retired`,
        description: `"${updated.name}" has been deactivated and unassigned from active custody.`,
        variant: 'info',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedNewAsset = () => {
    setNewAssetModalOpen(false);
    if (selectedNewType === 'Compliance') {
      onNavigate('/assets/compliance?flow=new');
    } else {
      onNavigate('/assets/non-compliance?flow=new');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setClassificationFilter('ALL');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    classificationFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  return (
    <div className="space-y-5">
      {/* Page Header with exact Title, Description, and Required Actions */}
      <PageHeader
        title="Assets"
        description="Track and manage company assets like devices, licenses, and equipment. Assign assets to employees, monitor status, and reduce loss or misplacement."
        contextMeta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-awn-text-secondary tabular-nums">
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {assetsData.summaryCounts.total}
              </strong>{' '}
              Total Assets
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {assetsData.summaryCounts.assigned}
              </strong>{' '}
              Assigned
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {assetsData.summaryCounts.available}
              </strong>{' '}
              Available
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {assetsData.summaryCounts.compliance}
              </strong>{' '}
              Compliance
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {assetsData.summaryCounts.nonCompliance}
              </strong>{' '}
              Non-Compliance
            </span>
          </div>
        }
        secondaryActions={
          <>
            <Button
              variant="outline"
              size="md"
              leftIcon={<ShieldCheck className="w-4 h-4 text-awn-primary" />}
              onClick={() => onNavigate('/assets/compliance')}
            >
              Compliance
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<Package className="w-4 h-4 text-awn-text-secondary" />}
              onClick={() => onNavigate('/assets/non-compliance')}
            >
              Non-Compliance
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
          </>
        }
        primaryAction={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setNewAssetModalOpen(true)}
          >
            New Asset
          </Button>
        }
      />

      {/* Main Assets Table Workspace */}
      <div className="bg-awn-surface border border-awn-border rounded-lg overflow-hidden">
        {/* Integrated Workspace Toolbar: Search, Classification, Category & Status Filters */}
        <div className="p-4 border-b border-awn-border space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Search Bar integrated into toolbar */}
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              <div className="w-full sm:w-80">
                <Input
                  placeholder="Search by asset ID, name, serial, employee, location..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  onClear={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  leftIcon={<Search className="w-4 h-4" />}
                  aria-label="Search assets"
                />
              </div>

              {/* Category Select Filter */}
              <div className="w-full sm:w-44">
                <Select
                  aria-label="Filter by asset category"
                  placeholder=""
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'ALL', label: 'All Categories' },
                    { value: 'Devices', label: 'Devices' },
                    { value: 'Licenses', label: 'Licenses' },
                    { value: 'Equipment', label: 'Equipment' },
                  ]}
                />
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Classification Segmented Control + Demo Reset */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Filter by asset classification"
                className="inline-flex items-center p-0.5 rounded-md bg-awn-surface-alt border border-awn-border"
              >
                {CLASSIFICATION_TABS.map((tab) => {
                  const active = classificationFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setClassificationFilter(tab.id);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-awn-surface text-awn-primary font-semibold border border-awn-border'
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
                  await assetModuleService.resetWorkspaceData('assets-group');
                  handleResetFilters();
                  await fetchAssets(1);
                  showToast({
                    title: 'Demo data restored',
                    description: 'Assets registry reset to initial state.',
                    variant: 'info',
                  });
                }}
                title="Reset demo state"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Secondary Toolbar Row: Status Filter & Record Count */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div
              role="group"
              aria-label="Filter by asset status"
              className="inline-flex flex-wrap items-center gap-1 p-1 rounded-md bg-awn-surface-alt border border-awn-border"
            >
              {STATUS_TABS.map((tab) => {
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
                        ? 'bg-awn-surface text-awn-primary font-semibold border border-awn-border'
                        : 'text-awn-text-secondary hover:text-awn-text-primary border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-awn-text-muted tabular-nums">
              Showing{' '}
              <span className="font-semibold text-awn-text-primary">
                {assetsData.items.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-awn-text-primary">
                {assetsData.pagination.totalItems}
              </span>{' '}
              assets
            </div>
          </div>
        </div>

        {/* Table Body / States */}
        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : assetsData.items.length === 0 ? (
          <EmptyState
            title="No matching assets found"
            description={
              hasActiveFilters
                ? 'No company assets match your current search query or selected filters.'
                : 'No assets are currently registered in the workspace.'
            }
            secondaryActionLabel={hasActiveFilters ? 'Reset All Filters' : null}
            onSecondaryAction={hasActiveFilters ? handleResetFilters : null}
            primaryActionLabel="New Asset"
            onPrimaryAction={() => setNewAssetModalOpen(true)}
          />
        ) : (
          <>
            {/* Desktop High-Density Enterprise Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-awn-surface-alt border-b border-awn-border text-xs font-semibold text-awn-text-secondary">
                    <th className="py-3 px-4 whitespace-nowrap">Asset ID</th>
                    <th className="py-3 px-4">Asset & Serial / License</th>
                    <th className="py-3 px-4 whitespace-nowrap">Category & Type</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap">Assigned To & Location</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-awn-border text-sm">
                  {assetsData.items.map((asset) => {
                    const isRetired = asset.status === 'Retired';
                    return (
                      <tr
                        key={asset.id}
                        className="hover:bg-awn-surface-alt transition-colors duration-100"
                      >
                        {/* Asset ID */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenView(asset)}
                            className="font-mono text-xs font-semibold text-awn-primary hover:underline tabular-nums cursor-pointer"
                          >
                            {asset.code}
                          </button>
                          <div className="text-[11px] text-awn-text-muted mt-0.5">
                            {asset.classification}
                          </div>
                        </td>

                        {/* Asset Name & Serial */}
                        <td className="py-3.5 px-4 align-middle">
                          <button
                            type="button"
                            onClick={() => handleOpenView(asset)}
                            className="font-medium text-awn-text-primary hover:text-awn-primary text-left leading-snug cursor-pointer"
                          >
                            {asset.name}
                          </button>
                          <div className="text-xs text-awn-text-muted mt-0.5 font-mono tabular-nums">
                            {asset.serialNumber}
                          </div>
                        </td>

                        {/* Category & Type */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="text-xs font-medium text-awn-text-primary">
                            {asset.category}
                          </div>
                          <div className="text-xs text-awn-text-secondary mt-0.5">
                            {asset.type}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <StatusBadge label={asset.status} tone={asset.statusTone} />
                        </td>

                        {/* Assigned Information */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          {asset.assignedTo ? (
                            <div>
                              <div className="text-xs font-medium text-awn-text-primary">
                                {asset.assignedTo}
                              </div>
                              <div className="text-xs text-awn-text-secondary mt-0.5">
                                {asset.department} · {asset.location}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-xs font-medium text-awn-text-muted">
                                Unassigned
                              </div>
                              <div className="text-xs text-awn-text-secondary mt-0.5">
                                {asset.location}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Discoverable Row Actions */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenView(asset)}
                              title="View asset details"
                              aria-label={`View ${asset.name}`}
                              className="px-2 py-1 rounded text-xs font-medium text-awn-text-secondary hover:text-awn-primary hover:bg-awn-surface border border-transparent hover:border-awn-border inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(asset)}
                              title="Edit asset"
                              aria-label={`Edit ${asset.name}`}
                              className="px-2 py-1 rounded text-xs font-medium text-awn-text-secondary hover:text-awn-primary hover:bg-awn-surface border border-transparent hover:border-awn-border inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Edit</span>
                            </button>

                            {!isRetired && (
                              <button
                                type="button"
                                onClick={() => handleOpenReassign(asset)}
                                title={
                                  asset.assignedTo
                                    ? 'Reassign asset to another employee'
                                    : 'Assign asset to an employee'
                                }
                                aria-label={
                                  asset.assignedTo
                                    ? `Reassign ${asset.name}`
                                    : `Assign ${asset.name}`
                                }
                                className="px-2 py-1 rounded text-xs font-medium text-awn-text-secondary hover:text-awn-primary hover:bg-awn-surface border border-transparent hover:border-awn-border inline-flex items-center gap-1 cursor-pointer"
                              >
                                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{asset.assignedTo ? 'Reassign' : 'Assign'}</span>
                              </button>
                            )}

                            {!isRetired && (
                              <button
                                type="button"
                                onClick={() => handleOpenRetire(asset)}
                                title="Retire / Deactivate asset"
                                aria-label={`Retire ${asset.name}`}
                                className="p-1.5 rounded text-awn-text-muted hover:text-awn-error hover:bg-awn-error-soft border border-transparent cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Responsive Mobile Card Representation */}
            <div className="md:hidden divide-y divide-awn-border">
              {assetsData.items.map((asset) => {
                const isRetired = asset.status === 'Retired';
                return (
                  <div key={asset.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => handleOpenView(asset)}
                          className="font-mono text-xs font-semibold text-awn-primary hover:underline tabular-nums cursor-pointer"
                        >
                          {asset.code}
                        </button>
                        <h3 className="text-sm font-semibold text-awn-text-primary mt-0.5">
                          {asset.name}
                        </h3>
                        <p className="text-xs text-awn-text-muted font-mono tabular-nums">
                          {asset.serialNumber} · {asset.classification}
                        </p>
                      </div>
                      <StatusBadge label={asset.status} tone={asset.statusTone} />
                    </div>

                    <div className="text-xs text-awn-text-secondary space-y-1">
                      <div>
                        <span className="text-awn-text-muted">Category: </span>
                        <span className="text-awn-text-primary font-medium">
                          {asset.category}
                        </span>
                        <span> · {asset.type}</span>
                      </div>
                      <div>
                        <span className="text-awn-text-muted">Assigned To: </span>
                        <span className="text-awn-text-primary font-medium">
                          {asset.assignedTo || 'Unassigned'}
                        </span>
                        <span> · {asset.location}</span>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenView(asset)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Pencil className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenEdit(asset)}
                      >
                        Edit
                      </Button>
                      {!isRetired && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenReassign(asset)}
                        >
                          {asset.assignedTo ? 'Reassign' : 'Assign'}
                        </Button>
                      )}
                      {!isRetired && (
                        <Button
                          variant="dangerOutline"
                          size="sm"
                          leftIcon={<Ban className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenRetire(asset)}
                        >
                          Retire
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Table Pagination Footer */}
        <div className="px-4 py-3 bg-awn-surface-alt border-t border-awn-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-awn-text-secondary">
          <div className="tabular-nums">
            Page{' '}
            <span className="font-semibold text-awn-text-primary">
              {assetsData.pagination.page}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-awn-text-primary">
              {assetsData.pagination.totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={assetsData.pagination.page <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                assetsData.pagination.page >= assetsData.pagination.totalPages || loading
              }
              onClick={() =>
                setCurrentPage((p) => Math.min(assetsData.pagination.totalPages, p + 1))
              }
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================
          NEW ASSET SELECTION MODAL (Lightweight Choice: Compliance vs Non-Compliance)
         ======================================================================== */}
      <Modal
        isOpen={newAssetModalOpen}
        onClose={() => setNewAssetModalOpen(false)}
        title="New Asset — Select Classification"
        description="Choose the governance classification for the asset you want to register. Each classification follows a tailored data capture and verification workflow."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewAssetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={handleProceedNewAsset}
            >
              Continue to {selectedNewType}
            </Button>
          </>
        }
      >
        <div className="space-y-3" role="radiogroup" aria-label="Asset classification choice">
          <button
            type="button"
            role="radio"
            aria-checked={selectedNewType === 'Compliance'}
            onClick={() => setSelectedNewType('Compliance')}
            className={`w-full text-left p-4 rounded-lg border transition-colors flex items-start gap-3.5 cursor-pointer ${
              selectedNewType === 'Compliance'
                ? 'bg-awn-primary-soft border-awn-primary'
                : 'bg-awn-surface border-awn-border hover:bg-awn-surface-alt'
            }`}
          >
            <div className="w-9 h-9 rounded-md bg-awn-surface border border-awn-border flex items-center justify-center text-awn-primary shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-awn-text-primary">
                  Compliance Asset
                </span>
                <span className="text-xs font-medium text-awn-primary">
                  Regulated & Audited
                </span>
              </div>
              <p className="text-xs text-awn-text-secondary mt-1 leading-relaxed">
                For critical equipment, safety systems, and enterprise licenses subject to
                statutory inspection schedules, certification renewals, or regulatory audits.
              </p>
            </div>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={selectedNewType === 'Non-Compliance'}
            onClick={() => setSelectedNewType('Non-Compliance')}
            className={`w-full text-left p-4 rounded-lg border transition-colors flex items-start gap-3.5 cursor-pointer ${
              selectedNewType === 'Non-Compliance'
                ? 'bg-awn-primary-soft border-awn-primary'
                : 'bg-awn-surface border-awn-border hover:bg-awn-surface-alt'
            }`}
          >
            <div className="w-9 h-9 rounded-md bg-awn-surface border border-awn-border flex items-center justify-center text-awn-primary shrink-0 mt-0.5">
              <Package className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-awn-text-primary">
                  Non-Compliance Asset
                </span>
                <span className="text-xs font-medium text-awn-text-secondary">
                  Standard Custody
                </span>
              </div>
              <p className="text-xs text-awn-text-secondary mt-1 leading-relaxed">
                For standard company devices, employee laptops, software subscriptions, and
                office equipment tracked for custody, lifecycle, and inventory control.
              </p>
            </div>
          </button>
        </div>
      </Modal>

      {/* ========================================================================
          VIEW & EDIT ASSET DRAWER
         ======================================================================== */}
      <Drawer
        isOpen={Boolean(drawerMode && activeAsset)}
        onClose={() => setDrawerMode(null)}
        title={
          drawerMode === 'edit'
            ? `Edit Asset · ${activeAsset?.code}`
            : `${activeAsset?.code} · Asset Overview`
        }
        subtitle={
          drawerMode === 'edit'
            ? 'Modify asset specifications, classification, or location.'
            : 'Review asset custody, technical identification, and lifecycle status.'
        }
        size="lg"
        footer={
          drawerMode === 'view' && activeAsset ? (
            <>
              <div className="flex items-center gap-2">
                {activeAsset.status !== 'Retired' && (
                  <Button
                    variant="dangerOutline"
                    size="sm"
                    leftIcon={<Ban className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenRetire(activeAsset)}
                  >
                    Retire / Deactivate
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeAsset.status !== 'Retired' && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenReassign(activeAsset)}
                  >
                    {activeAsset.assignedTo ? 'Reassign' : 'Assign'}
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Pencil className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenEdit(activeAsset)}
                >
                  Edit Asset
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDrawerMode('view')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={submitting}
                onClick={handleSaveEdit}
              >
                Save Changes
              </Button>
            </>
          )
        }
      >
        {drawerMode === 'view' && activeAsset ? (
          <div className="space-y-6">
            {/* Summary Banner */}
            <div className="p-4 rounded-lg bg-awn-surface-alt border border-awn-border flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-awn-primary tabular-nums">
                    {activeAsset.code}
                  </span>
                  <span className="text-xs text-awn-text-muted">·</span>
                  <span className="text-xs font-medium text-awn-text-secondary">
                    {activeAsset.classification}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-awn-text-primary mt-1">
                  {activeAsset.name}
                </h3>
                <p className="text-xs text-awn-text-secondary mt-0.5 font-mono tabular-nums">
                  Serial / Key: {activeAsset.serialNumber}
                </p>
              </div>
              <StatusBadge label={activeAsset.status} tone={activeAsset.statusTone} />
            </div>

            {/* Assigned Employee / Custody Card */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-awn-text-primary">
                  Custody & Assignment
                </h4>
                {activeAsset.status !== 'Retired' && (
                  <button
                    type="button"
                    onClick={() => handleOpenReassign(activeAsset)}
                    className="text-xs font-medium text-awn-primary hover:underline cursor-pointer"
                  >
                    {activeAsset.assignedTo ? 'Change Assignee' : 'Assign to Employee'}
                  </button>
                )}
              </div>

              <div className="p-4 rounded-lg border border-awn-border bg-awn-surface flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-awn-primary-soft border border-awn-border text-awn-primary flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 text-xs space-y-1">
                  {activeAsset.assignedTo ? (
                    <>
                      <div className="font-semibold text-awn-text-primary text-sm">
                        {activeAsset.assignedTo}
                      </div>
                      <div className="text-awn-text-secondary">
                        {activeAsset.assignedRole} · {activeAsset.department}
                      </div>
                      <div className="text-awn-text-muted tabular-nums">
                        Location: {activeAsset.location} · Assigned {activeAsset.assignedDate}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold text-awn-text-secondary text-sm">
                        Currently Unassigned
                      </div>
                      <div className="text-awn-text-muted">
                        Held at {activeAsset.location} ({activeAsset.department})
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-awn-text-primary">
                Asset Specifications
              </h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded border border-awn-border">
                  <dt className="text-awn-text-muted">Category</dt>
                  <dd className="font-medium text-awn-text-primary mt-0.5">
                    {activeAsset.category}
                  </dd>
                </div>
                <div className="p-3 rounded border border-awn-border">
                  <dt className="text-awn-text-muted">Asset Type</dt>
                  <dd className="font-medium text-awn-text-primary mt-0.5">
                    {activeAsset.type}
                  </dd>
                </div>
                <div className="p-3 rounded border border-awn-border">
                  <dt className="text-awn-text-muted">Book Value</dt>
                  <dd className="font-mono font-medium text-awn-text-primary mt-0.5 tabular-nums">
                    {activeAsset.value || 'SAR —'}
                  </dd>
                </div>
                <div className="p-3 rounded border border-awn-border">
                  <dt className="text-awn-text-muted">Last Updated</dt>
                  <dd className="font-mono font-medium text-awn-text-primary mt-0.5 tabular-nums">
                    {activeAsset.updatedAt}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-awn-text-primary">
                Operational & Governance Notes
              </h4>
              <div className="p-3.5 rounded border border-awn-border bg-awn-surface-alt text-xs text-awn-text-secondary leading-relaxed">
                {activeAsset.notes}
              </div>
            </div>

            {activeAsset.classification === 'Compliance' && (
              <div className="p-4 rounded-lg bg-awn-primary-soft border border-awn-border flex items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-semibold text-awn-text-primary">
                    Compliance Asset & Document Matrix
                  </div>
                  <div className="text-awn-text-secondary mt-0.5">
                    Inspect vehicle registration, fitness, insurance, operations card, and document matrix.
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setDrawerMode(null);
                    onNavigate(
                      activeAsset.id.startsWith('CMP-')
                        ? `/assets/compliance?assetId=${activeAsset.id}`
                        : '/assets/compliance'
                    );
                  }}
                >
                  Open Compliance Details
                </Button>
              </div>
            )}

            {activeAsset.classification === 'Non-Compliance' && (
              <div className="p-4 rounded-lg bg-awn-primary-soft border border-awn-border flex items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-semibold text-awn-text-primary">
                    Non-Compliance Asset & Financial Details
                  </div>
                  <div className="text-awn-text-secondary mt-0.5">
                    Inspect basic identification, financial ownership, and warranty document records.
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setDrawerMode(null);
                    onNavigate(
                      activeAsset.id.startsWith('NCM-')
                        ? `/assets/non-compliance?assetId=${activeAsset.id}`
                        : '/assets/non-compliance'
                    );
                  }}
                >
                  Open Non-Compliance Details
                </Button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSaveEdit} noValidate className="space-y-5">
            <FormSection
              title="Asset Identification"
              description="Update the primary title, category, type, and serial or license identifier."
              columns={1}
            >
              <Input
                label="Asset Name"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                error={editErrors.name}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  required
                  options={selectOptions.categories}
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                />
                <Select
                  label="Classification"
                  required
                  options={selectOptions.classifications}
                  value={editForm.classification}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      classification: e.target.value as AssetClassification,
                    })
                  }
                />
              </div>
              <Input
                label="Asset Type"
                required
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                error={editErrors.type}
              />
              <Input
                label="Serial Number / License Key"
                required
                value={editForm.serialNumber}
                onChange={(e) =>
                  setEditForm({ ...editForm, serialNumber: e.target.value })
                }
                error={editErrors.serialNumber}
              />
            </FormSection>

            <FormSection
              title="Status, Location & Notes"
              description="Manage operational status, physical placement, and audit notes."
              columns={1}
            >
              <Select
                label="Operational Status"
                required
                options={selectOptions.statuses}
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              />
              <Select
                label="Location"
                required
                options={selectOptions.locations}
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
              <Textarea
                label="Governance & Maintenance Notes"
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </FormSection>
          </form>
        )}
      </Drawer>

      {/* ========================================================================
          REASSIGN / ASSIGN ASSET MODAL
         ======================================================================== */}
      <Modal
        isOpen={Boolean(reassignTarget)}
        onClose={() => setReassignTarget(null)}
        title={
          reassignTarget?.assignedTo
            ? `Reassign Asset · ${reassignTarget.code}`
            : `Assign Asset · ${reassignTarget?.code}`
        }
        description={
          reassignTarget
            ? `Manage employee custody and location for "${reassignTarget.name}".`
            : ''
        }
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReassignTarget(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={submitting}
              onClick={handleConfirmReassign}
            >
              {reassignForm.mode === 'unassign'
                ? 'Release to Inventory Pool'
                : 'Confirm Assignment'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmReassign} className="space-y-4">
          {reassignTarget?.assignedTo && (
            <div
              role="group"
              aria-label="Assignment action type"
              className="grid grid-cols-2 gap-2 p-1 rounded-md bg-awn-surface-alt border border-awn-border"
            >
              <button
                type="button"
                onClick={() => setReassignForm((prev) => ({ ...prev, mode: 'assign' }))}
                className={`py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  reassignForm.mode === 'assign'
                    ? 'bg-awn-surface text-awn-primary font-semibold border border-awn-border'
                    : 'text-awn-text-secondary hover:text-awn-text-primary'
                }`}
              >
                Assign to Employee
              </button>
              <button
                type="button"
                onClick={() => setReassignForm((prev) => ({ ...prev, mode: 'unassign' }))}
                className={`py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  reassignForm.mode === 'unassign'
                    ? 'bg-awn-surface text-awn-primary font-semibold border border-awn-border'
                    : 'text-awn-text-secondary hover:text-awn-text-primary'
                }`}
              >
                Unassign to Pool
              </button>
            </div>
          )}

          {reassignForm.mode === 'assign' ? (
            <>
              <Select
                label="Select Employee Custodian"
                required
                value={reassignForm.employeeName}
                onChange={(e) => handleSelectEmployeePreset(e.target.value)}
                options={employees.map((emp) => ({
                  value: emp.name,
                  label: `${emp.name} — ${emp.department}`,
                }))}
                error={reassignError}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Role / Title"
                  value={reassignForm.assignedRole}
                  onChange={(e) =>
                    setReassignForm({ ...reassignForm, assignedRole: e.target.value })
                  }
                />
                <Input
                  label="Department"
                  value={reassignForm.department}
                  onChange={(e) =>
                    setReassignForm({ ...reassignForm, department: e.target.value })
                  }
                />
              </div>

              <Select
                label="Assigned Location"
                options={selectOptions.locations}
                value={reassignForm.location}
                onChange={(e) =>
                  setReassignForm({ ...reassignForm, location: e.target.value })
                }
              />
            </>
          ) : (
            <div className="p-3.5 rounded-md bg-awn-surface-alt border border-awn-border text-xs text-awn-text-secondary space-y-2">
              <p>
                Releasing <strong className="text-awn-text-primary">{reassignTarget?.code}</strong>{' '}
                will remove <strong className="text-awn-text-primary">{reassignTarget?.assignedTo}</strong>{' '}
                as custodian and set the asset status to <strong>Available</strong>.
              </p>
              <Select
                label="Return Depot Location"
                options={selectOptions.locations}
                value={reassignForm.location}
                onChange={(e) =>
                  setReassignForm({ ...reassignForm, location: e.target.value })
                }
              />
            </div>
          )}

          <Textarea
            label="Handover / Custody Note"
            rows={2}
            placeholder="Optional handover reference or ticket number..."
            value={reassignForm.notes}
            onChange={(e) => setReassignForm({ ...reassignForm, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* ========================================================================
          RETIRE / DEACTIVATE CONFIRMATION DIALOG
         ======================================================================== */}
      <ConfirmDialog
        isOpen={Boolean(retireTarget)}
        onClose={() => setRetireTarget(null)}
        onConfirm={handleConfirmRetire}
        title="Retire / Deactivate Asset"
        description="Retiring an asset removes it from active operational service, unassigns any current custodian, and transitions its lifecycle status to Retired."
        itemSummary={
          retireTarget ? `${retireTarget.code} — ${retireTarget.name}` : null
        }
        confirmLabel="Confirm Retirement"
        loading={submitting}
      >
        <Input
          label="Retirement / Deactivation Reason"
          placeholder="e.g., End of lifecycle, hardware fault, or license expiration"
          value={retireReason}
          onChange={(e) => setRetireReason(e.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}
