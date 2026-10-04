import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
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
import { DataTable, dataTableFeatures } from '../components/table/DataTable.tsx';
import type { ColumnDef } from '@tanstack/react-table';
import { useLanguage } from '../hooks/useLanguage.tsx';
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
  const { isRtl, formatNumber } = useLanguage();
  const selectOptions = assetModuleService.getSelectOptions();
  const employees = assetModuleService.getEmployeeDirectory();

  const classificationTabs: TableFilterTab<'ALL' | AssetClassification>[] = [
    { id: 'ALL', label: isRtl ? 'كافة الأصول' : 'All Assets' },
    { id: 'Compliance', label: isRtl ? 'أصول الامتثال' : 'Compliance' },
    { id: 'Non-Compliance', label: isRtl ? 'الأصول القياسية' : 'Non-Compliance' },
  ];

  const statusTabs: TableFilterTab[] = [
    { id: 'ALL', label: isRtl ? 'كافة الحالات' : 'All Statuses' },
    { id: 'Assigned', label: isRtl ? 'مسندة بالعهدة' : 'Assigned' },
    { id: 'Available', label: isRtl ? 'متاحة بالمستودع' : 'Available' },
    { id: 'Compliance Due', label: isRtl ? 'استحقاق امتثال' : 'Compliance Due' },
    { id: 'In Maintenance', label: isRtl ? 'تحت الصيانة' : 'In Maintenance' },
    { id: 'Retired', label: isRtl ? 'مستبعدة' : 'Retired' },
  ];

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
  const pageSize = 8;

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

  const columns = useMemo<ColumnDef<typeof dataTableFeatures, Asset>[]>(
    () => [
      {
        id: 'code',
        accessorKey: 'code',
        header: () => (isRtl ? 'رمز الأصل' : 'Asset ID'),
        cell: ({ row }) => {
          const asset = row.original;
          return (
            <div>
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
            </div>
          );
        },
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: () => (isRtl ? 'الأصل والرقم التسلسلي' : 'Asset & Serial / License'),
        cell: ({ row }) => {
          const asset = row.original;
          return (
            <div>
              <button
                type="button"
                onClick={() => handleOpenView(asset)}
                className="font-medium text-awn-text-primary hover:text-awn-primary text-left rtl:text-right leading-snug cursor-pointer"
              >
                {asset.name}
              </button>
              <div className="text-xs text-awn-text-muted mt-0.5 font-mono tabular-nums">
                {asset.serialNumber}
              </div>
            </div>
          );
        },
      },
      {
        id: 'category',
        accessorKey: 'category',
        header: () => (isRtl ? 'التصنيف والنوع' : 'Category & Type'),
        cell: ({ row }) => {
          const asset = row.original;
          return (
            <div>
              <div className="text-xs font-medium text-awn-text-primary">
                {asset.category}
              </div>
              <div className="text-xs text-awn-text-secondary mt-0.5">
                {asset.type}
              </div>
            </div>
          );
        },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: () => (isRtl ? 'حالة الأصل' : 'Status'),
        cell: ({ row }) => {
          const asset = row.original;
          return <StatusBadge label={asset.status} tone={asset.statusTone} />;
        },
      },
      {
        id: 'assignedTo',
        accessorKey: 'assignedTo',
        header: () => (isRtl ? 'المسند إليه والموقع' : 'Assigned To & Location'),
        cell: ({ row }) => {
          const asset = row.original;
          return asset.assignedTo ? (
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
                {isRtl ? 'غير مسند (بالمستودع)' : 'Unassigned'}
              </div>
              <div className="text-xs text-awn-text-secondary mt-0.5">
                {asset.location}
              </div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => (
          <div className="text-right rtl:text-left">{isRtl ? 'الإجراءات' : 'Actions'}</div>
        ),
        cell: ({ row }) => {
          const asset = row.original;
          const isRetired = asset.status === 'Retired';
          return (
            <div className="inline-flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => handleOpenView(asset)}
                title={isRtl ? 'عرض تفاصيل الأصل' : 'View asset details'}
                aria-label={isRtl ? `عرض ${asset.name}` : `View ${asset.name}`}
                className="px-2 py-1 rounded text-xs font-medium text-awn-text-secondary hover:text-awn-primary hover:bg-awn-surface border border-transparent hover:border-awn-border inline-flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isRtl ? 'عرض' : 'View'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenEdit(asset)}
                title={isRtl ? 'تعديل بيانات الأصل' : 'Edit asset'}
                aria-label={isRtl ? `تعديل ${asset.name}` : `Edit ${asset.name}`}
                className="px-2 py-1 rounded text-xs font-medium text-awn-text-secondary hover:text-awn-primary hover:bg-awn-surface border border-transparent hover:border-awn-border inline-flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isRtl ? 'تعديل' : 'Edit'}</span>
              </button>

              {!isRetired && (
                <button
                  type="button"
                  onClick={() => handleOpenReassign(asset)}
                  title={
                    asset.assignedTo
                      ? isRtl
                        ? 'نقل العهدة إلى موظف آخر'
                        : 'Reassign asset to another employee'
                      : isRtl
                      ? 'إسناد العهدة إلى موظف'
                      : 'Assign asset to an employee'
                  }
                  aria-label={
                    asset.assignedTo
                      ? isRtl
                        ? `نقل عهدة ${asset.name}`
                        : `Reassign ${asset.name}`
                      : isRtl
                      ? `إسناد ${asset.name}`
                      : `Assign ${asset.name}`
                  }
                  className="px-2 py-1 rounded text-xs font-medium text-awn-text-secondary hover:text-awn-primary hover:bg-awn-surface border border-transparent hover:border-awn-border inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {isRtl
                      ? asset.assignedTo
                        ? 'نقل العهدة'
                        : 'إسناد'
                      : asset.assignedTo
                      ? 'Reassign'
                      : 'Assign'}
                  </span>
                </button>
              )}

              {!isRetired && (
                <button
                  type="button"
                  onClick={() => handleOpenRetire(asset)}
                  title={isRtl ? 'إحالة الأصل للتقاعد / الاستبعاد' : 'Retire / Deactivate asset'}
                  aria-label={isRtl ? `استبعاد ${asset.name}` : `Retire ${asset.name}`}
                  className="p-1.5 rounded text-awn-text-muted hover:text-awn-error hover:bg-awn-error-soft border border-transparent cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [isRtl]
  );

  return (
    <div className="space-y-5">
      {/* Page Header with exact Title, Description, and Required Actions */}
      <PageHeader
        title={isRtl ? 'سجل الأصول' : 'Assets'}
        description={
          isRtl
            ? 'حصر ومتابعة الأصول المؤسسية من أجهزة وتراخيص ومعدات، وتعيين العهد للموظفين، وتتبع الحالة التشغيلية ومراقبة الالتزام النظامي.'
            : 'Track and manage company assets like devices, licenses, and equipment. Assign assets to employees, monitor status, and reduce loss or misplacement.'
        }
        contextMeta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-awn-text-secondary tabular-nums">
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(assetsData.summaryCounts.total)}
              </strong>{' '}
              {isRtl ? 'إجمالي الأصول' : 'Total Assets'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(assetsData.summaryCounts.assigned)}
              </strong>{' '}
              {isRtl ? 'مسندة بالعهدة' : 'Assigned'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(assetsData.summaryCounts.available)}
              </strong>{' '}
              {isRtl ? 'بالمستودع' : 'Available'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(assetsData.summaryCounts.compliance)}
              </strong>{' '}
              {isRtl ? 'أصول الامتثال' : 'Compliance'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(assetsData.summaryCounts.nonCompliance)}
              </strong>{' '}
              {isRtl ? 'أصول قياسية' : 'Non-Compliance'}
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
              {isRtl ? 'أصول الامتثال' : 'Compliance'}
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<Package className="w-4 h-4 text-awn-text-secondary" />}
              onClick={() => onNavigate('/assets/non-compliance')}
            >
              {isRtl ? 'الأصول القياسية' : 'Non-Compliance'}
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportCsv}
            >
              {isRtl ? 'تصدير CSV' : 'Export CSV'}
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
            {isRtl ? 'إضافة أصل' : 'New Asset'}
          </Button>
        }
      />

      {/* Classification & Status Filter Strips */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-awn-surface border border-awn-border rounded-lg p-2.5">
        <div
          role="group"
          aria-label={isRtl ? 'تصفية الأصول حسب نوع الرقابة' : 'Filter by asset classification'}
          className="inline-flex items-center p-0.5 rounded-md bg-awn-surface-alt border border-awn-border"
        >
          {classificationTabs.map((tab) => {
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

        <div
          role="group"
          aria-label={isRtl ? 'تصفية الأصول حسب الحالة التشغيلية' : 'Filter by asset status'}
          className="inline-flex flex-wrap items-center gap-1 p-0.5 rounded-md bg-awn-surface-alt border border-awn-border"
        >
          {statusTabs.map((tab) => {
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
      </div>

      {/* Main Assets DataTable */}
      <DataTable
        title={isRtl ? 'سجل الأصول' : 'Assets Registry'}
        subtitle={
          isRtl
            ? 'إدارة دورة حياة الأصول، العهد، حالات الفحص والامتثال.'
            : 'Track enterprise asset lifecycle, custodians, maintenance, and compliance.'
        }
        columns={columns}
        data={assetsData.items}
        count={assetsData.pagination.totalItems}
        loading={loading}
        pageIndex={currentPage - 1}
        pageSize={pageSize}
        onPageChange={(newPageIndex) => {
          const next = newPageIndex + 1;
          setCurrentPage(next);
          fetchAssets(next);
        }}
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder={
          isRtl
            ? 'البحث برمز الأصل، الاسم، الرقم التسلسلي، الموظف...'
            : 'Search by asset ID, name, serial, employee, location...'
        }
        onAddNew={() => setNewAssetModalOpen(true)}
        addNewLabel={isRtl ? 'إضافة أصل' : 'New Asset'}
        onExport={handleExportCsv}
        exportLabel={isRtl ? 'تصدير CSV' : 'Export CSV'}
        toolbarSlot={
          <div className="flex items-center gap-2">
            <div className="w-36">
              <Select
                aria-label={isRtl ? 'تصفية حسب التصنيف' : 'Filter by asset category'}
                placeholder=""
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'ALL', label: isRtl ? 'كافة التصنيفات' : 'All Categories' },
                  { value: 'Devices', label: isRtl ? 'الأجهزة والعتاد' : 'Devices' },
                  { value: 'Licenses', label: isRtl ? 'التراخيص والبرمجيات' : 'Licenses' },
                  { value: 'Equipment', label: isRtl ? 'الآلات والمعدات' : 'Equipment' },
                ]}
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                {isRtl ? 'مسح التصفية' : 'Clear'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={async () => {
                await assetModuleService.resetWorkspaceData('assets-group');
                handleResetFilters();
                await fetchAssets(1);
                showToast({
                  title: isRtl ? 'تم استرجاع البيانات التجريبية' : 'Demo data restored',
                  description: isRtl
                    ? 'تمت إعادة ضبط سجل الأصول إلى حالته الافتراضية.'
                    : 'Assets registry reset to initial state.',
                  variant: 'info',
                });
              }}
              title={isRtl ? 'إعادة تعيين الحالة' : 'Reset demo state'}
            >
              {isRtl ? 'إعادة ضبط' : 'Reset'}
            </Button>
          </div>
        }
      />

      {/* ========================================================================
          NEW ASSET SELECTION MODAL (Lightweight Choice: Compliance vs Non-Compliance)
         ======================================================================== */}
      <Modal
        isOpen={newAssetModalOpen}
        onClose={() => setNewAssetModalOpen(false)}
        title={isRtl ? 'تسجيل أصل جديد — اختيار نوع الرقابة' : 'New Asset — Select Classification'}
        description={
          isRtl
            ? 'حدد ما إذا كان الأصل يخضع للاشتراطات التنظيمية والامتثال الحكومي، أم أصل قياسي لتتبع العهد والمستودع.'
            : 'Choose the governance classification for the asset you want to register. Each classification follows a tailored data capture and verification workflow.'
        }
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewAssetModalOpen(false)}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              rightIcon={isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              onClick={handleProceedNewAsset}
            >
              {isRtl
                ? `متابعة التسجيل (${selectedNewType === 'Compliance' ? 'أصل امتثال' : 'أصل قياسي'})`
                : `Continue to ${selectedNewType}`}
            </Button>
          </>
        }
      >
        <div className="space-y-3" role="radiogroup" aria-label={isRtl ? 'اختيار تصنيف الأصل' : 'Asset classification choice'}>
          <button
            type="button"
            role="radio"
            aria-checked={selectedNewType === 'Compliance'}
            onClick={() => setSelectedNewType('Compliance')}
            className={`w-full text-left rtl:text-right p-4 rounded-lg border transition-colors flex items-start gap-3.5 cursor-pointer ${
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
                  {isRtl ? 'أصل خاضع للامتثال النظامي' : 'Compliance Asset'}
                </span>
                <span className="text-xs font-medium text-awn-primary">
                  {isRtl ? 'خاضع للرقابة والتدقيق' : 'Regulated & Audited'}
                </span>
              </div>
              <p className="text-xs text-awn-text-secondary mt-1 leading-relaxed">
                {isRtl
                  ? 'مركبات ومعدات ثقيلة، أنظمة إخماد وسلامة، أو أصول خاضعة للفحص الدوري والدفاع المدني وهيئة النقل.'
                  : 'For critical equipment, safety systems, and enterprise licenses subject to statutory inspection schedules, certification renewals, or regulatory audits.'}
              </p>
            </div>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={selectedNewType === 'Non-Compliance'}
            onClick={() => setSelectedNewType('Non-Compliance')}
            className={`w-full text-left rtl:text-right p-4 rounded-lg border transition-colors flex items-start gap-3.5 cursor-pointer ${
              selectedNewType === 'Non-Compliance'
                ? 'bg-awn-primary-soft border-awn-primary'
                : 'bg-awn-surface border-awn-border hover:bg-awn-surface-alt'
            }`}
          >
            <div className="w-9 h-9 rounded-md bg-awn-surface border border-awn-border flex items-center justify-center text-awn-text-secondary shrink-0 mt-0.5">
              <Package className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-awn-text-primary">
                  {isRtl ? 'أصل قياسي (بدون اشتراطات امتثال)' : 'Non-Compliance Asset'}
                </span>
                <span className="text-xs font-medium text-awn-text-muted">
                  {isRtl ? 'تتبع العهد والمستودع' : 'Standard Operations'}
                </span>
              </div>
              <p className="text-xs text-awn-text-secondary mt-1 leading-relaxed">
                {isRtl
                  ? 'أجهزة الحاسوب والمحمول، الشاشات، الهواتف، التراخيص البرمجية، والأثاث المكتبي المدار لتتبع العهد.'
                  : 'Operational equipment, laptops, workstations, peripherals, and software licenses tracked for custody and inventory.'}
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
