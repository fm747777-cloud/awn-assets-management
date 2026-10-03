import React, { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FolderTree,
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
import { useLanguage } from '../hooks/useLanguage.tsx';
import type {
  AssetCategoriesQueryResponse,
  AssetCategory,
  AssetCategoryFormData,
  SelectOption,
  ValidationErrors,
} from '../types/index.ts';

const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: 'English', label: 'English' },
  { value: 'Arabic (العربية)', label: 'Arabic (العربية)' },
  { value: 'Bilingual (EN / AR)', label: 'Bilingual (EN / AR)' },
];

export default function AssetCategoriesPage() {
  const { showToast } = useToast();
  const { isRtl, formatNumber } = useLanguage();

  // Table & Query State
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [categoriesData, setCategoriesData] = useState<AssetCategoriesQueryResponse>({
    items: [],
    allMatchingItems: [],
    summaryTotalLabel: '89 Asset Categories',
    totalRecordsCount: 5,
    activeCount: 4,
    inactiveCount: 1,
    pagination: { page: 1, pageSize: 8, totalItems: 0, totalPages: 1 },
  });

  // Details Drawer State
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Create / Edit Form Modal State (reusing the same form structure)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<AssetCategoryFormData>({
    categoryId: 'AC006',
    language: 'English',
    categoryName: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Deactivate Confirmation Dialog State
  const [deactivateTarget, setDeactivateTarget] = useState<AssetCategory | null>(
    null
  );

  // Delete Confirmation Dialog State
  const [deleteTarget, setDeleteTarget] = useState<AssetCategory | null>(null);

  const fetchCategories = useCallback(
    async (targetPage = currentPage) => {
      setLoading(true);
      try {
        const response = await assetModuleService.getAssetCategories({
          search: searchQuery,
          page: targetPage,
          pageSize,
        });
        setCategoriesData(response);
        setCurrentPage(response.pagination.page);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, currentPage]
  );

  useEffect(() => {
    fetchCategories(1);
  }, [searchQuery]);

  // ============================================================================
  // DETAILS HANDLERS
  // ============================================================================
  const handleOpenCategoryDetails = (category: AssetCategory) => {
    setSelectedCategory(category);
    setDetailsOpen(true);
  };

  // ============================================================================
  // CREATE / EDIT FORM HANDLERS (Reusing Single Form Implementation)
  // ============================================================================
  const handleOpenCreateModal = () => {
    const nextId = assetModuleService.generateNextCategoryId();
    setFormMode('create');
    setFormData({
      categoryId: nextId,
      language: 'English',
      categoryName: '',
      description: '',
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (category: AssetCategory) => {
    setFormMode('edit');
    setFormData({
      categoryId: category.categoryId,
      language: category.language || 'English',
      categoryName: category.categoryName,
      description: category.description,
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const validateCategoryForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!formData.categoryName.trim()) {
      errors.categoryName = 'Category Name is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateCategoryForm()) return;

    setSubmitting(true);
    try {
      if (formMode === 'create') {
        const created = await assetModuleService.createAssetCategory({
          categoryId: formData.categoryId,
          language: formData.language,
          categoryName: formData.categoryName,
          description: formData.description,
        });
        setFormModalOpen(false);
        setSelectedCategory(created);
        await fetchCategories(1);
        showToast({
          title: `Category ${created.categoryId} Created`,
          description: `"${created.categoryName}" has been added to Asset Categories.`,
          variant: 'success',
        });
      } else {
        const updated = await assetModuleService.updateAssetCategory(
          formData.categoryId,
          {
            language: formData.language,
            categoryName: formData.categoryName,
            description: formData.description,
          }
        );
        setFormModalOpen(false);
        if (selectedCategory?.categoryId === updated.categoryId) {
          setSelectedCategory(updated);
        }
        await fetchCategories(currentPage);
        showToast({
          title: `Category ${updated.categoryId} Updated`,
          description: `Changes to "${updated.categoryName}" have been saved.`,
          variant: 'success',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // DEACTIVATE CATEGORY HANDLERS
  // ============================================================================
  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setSubmitting(true);
    try {
      const updated = await assetModuleService.deactivateAssetCategory(
        deactivateTarget.categoryId
      );
      if (selectedCategory?.categoryId === updated.categoryId) {
        setSelectedCategory(updated);
      }
      setDeactivateTarget(null);
      await fetchCategories(currentPage);
      showToast({
        title: `Category ${updated.categoryId} Deactivated`,
        description: `"${updated.categoryName}" is now marked as Inactive.`,
        variant: 'info',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================================
  // DELETE CATEGORY HANDLERS
  // ============================================================================
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const targetId = deleteTarget.categoryId;
      const targetName = deleteTarget.categoryName;
      await assetModuleService.deleteAssetCategory(targetId);

      if (selectedCategory?.categoryId === targetId) {
        setDetailsOpen(false);
        setSelectedCategory(null);
      }
      setDeleteTarget(null);
      await fetchCategories(currentPage);
      showToast({
        title: `Category ${targetId} Deleted`,
        description: `"${targetName}" has been removed from Asset Categories.`,
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
    const recordsToExport = categoriesData.allMatchingItems;
    if (!recordsToExport || recordsToExport.length === 0) {
      showToast({
        title: 'No categories to export',
        description: 'Adjust your search filter before exporting to CSV.',
        variant: 'warning',
      });
      return;
    }

    const csvContent = assetModuleService.exportAssetCategoriesCsv(recordsToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `AWN_Asset_Categories_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      title: 'Exported Asset Categories CSV',
      description: `${recordsToExport.length} category record(s) exported to AWN_Asset_Categories_${today}.csv.`,
      variant: 'success',
    });
  };

  return (
    <div className="space-y-5">
      {/* Page Header with exact Title, Description, Summary ("89 Asset Categories"), and Actions ("Export CSV", "New Asset") */}
      <PageHeader
        title={isRtl ? 'تصنيفات الأصول' : 'Asset Categories'}
        description={
          isRtl
            ? 'تنظيم وهيكلة الأصول المؤسسية عبر تصنيفات معتمدة مثل تقنية المعلومات، المركبات، والأثاث، لتوحيد قيود الإهلاك والتقارير الرقابية.'
            : 'Organize and manage your assets efficiently by grouping them into relevant categories such as IT Equipment, Vehicles, Furniture, and more. This helps streamline tracking and reporting.'
        }
        contextMeta={
          <div className="flex flex-wrap items-center gap-2 text-xs text-awn-text-secondary tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-semibold text-awn-text-primary">
              <FolderTree className="w-3.5 h-3.5 text-awn-primary" aria-hidden="true" />
              <span>
                {isRtl
                  ? `${formatNumber(categoriesData.totalRecordsCount)} تصنيفات أصول`
                  : categoriesData.summaryTotalLabel}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(categoriesData.activeCount)}
              </strong>{' '}
              {isRtl ? 'نشط' : 'Active'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-semibold text-awn-text-primary">
                {formatNumber(categoriesData.inactiveCount)}
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
            {isRtl ? 'إضافة تصنيف' : 'New Category'}
          </Button>
        }
      />

      {/* Main Asset Categories Table Container */}
      <div className="bg-awn-surface border border-awn-border rounded-lg overflow-hidden">
        {/* Search & Summary Toolbar */}
        <div className="p-4 border-b border-awn-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              placeholder={
                isRtl
                  ? 'البحث برمز التصنيف، الاسم، الوصف...'
                  : 'Search by Category ID, Category Name, Description...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              leftIcon={<Search className="w-4 h-4" />}
              aria-label={isRtl ? 'بحث في تصنيفات الأصول' : 'Search asset categories'}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-awn-text-secondary">
            <span className="px-2.5 py-1 rounded-md bg-awn-surface-alt border border-awn-border font-semibold text-awn-text-primary tabular-nums">
              {isRtl
                ? `${formatNumber(categoriesData.totalRecordsCount)} تصنيف أصل`
                : categoriesData.summaryTotalLabel}
            </span>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : categoriesData.items.length === 0 ? (
          <EmptyState
            title={isRtl ? 'لم يتم العثور على تصنيفات' : 'No Asset Categories Found'}
            description={
              searchQuery
                ? isRtl
                  ? `لا توجد تصنيفات تطابق "${searchQuery}". جرب إفراغ خانة البحث.`
                  : `No asset categories matched "${searchQuery}". Try clearing your search query.`
                : isRtl
                ? 'لا توجد تصنيفات أصول مسجلة حالياً. انقر على "إضافة تصنيف" للبدء.'
                : 'No asset categories are currently registered. Click "New Asset" to create your first category.'
            }
            primaryActionLabel={
              searchQuery
                ? isRtl
                  ? 'مسح البحث'
                  : 'Clear Search'
                : isRtl
                ? 'إضافة تصنيف'
                : 'New Asset'
            }
            onPrimaryAction={
              searchQuery ? () => setSearchQuery('') : handleOpenCreateModal
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right border-collapse">
                <thead>
                  <tr className="bg-awn-surface-alt border-b border-awn-border text-xs font-semibold text-awn-text-secondary">
                    <th className="py-3 px-4 whitespace-nowrap">
                      {isRtl ? 'رمز التصنيف' : 'Category ID'}
                    </th>
                    <th className="py-3 px-4 whitespace-nowrap">
                      {isRtl ? 'اسم التصنيف' : 'Category Name'}
                    </th>
                    <th className="py-3 px-4">{isRtl ? 'الوصف' : 'Description'}</th>
                    <th className="py-3 px-4 whitespace-nowrap">
                      {isRtl ? 'تاريخ الإنشاء' : 'Created Date'}
                    </th>
                    <th className="py-3 px-4 whitespace-nowrap">
                      {isRtl ? 'الحالة' : 'Status'}
                    </th>
                    <th className="py-3 px-4 whitespace-nowrap text-right rtl:text-left">
                      {isRtl ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-awn-border text-sm">
                  {categoriesData.items.map((category) => {
                    const isActive = category.status === 'Active';
                    return (
                      <tr
                        key={category.categoryId}
                        className="hover:bg-awn-surface-alt transition-colors group"
                      >
                        {/* Category ID */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenCategoryDetails(category)}
                            className="font-mono text-xs font-semibold text-awn-primary hover:underline tabular-nums cursor-pointer"
                          >
                            {category.categoryId}
                          </button>
                        </td>

                        {/* Category Name */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenCategoryDetails(category)}
                            className="font-medium text-awn-text-primary hover:text-awn-primary text-left transition-colors cursor-pointer"
                          >
                            {category.categoryName}
                          </button>
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4 align-middle text-xs text-awn-text-secondary max-w-md">
                          {category.description || '—'}
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap font-mono text-xs text-awn-text-secondary tabular-nums">
                          {category.createdDate}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <StatusBadge
                            label={category.status}
                            tone={category.statusTone}
                          />
                        </td>

                        {/* Row Actions */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenCategoryDetails(category)}
                              title={`View ${category.categoryName}`}
                              aria-label={`View ${category.categoryName}`}
                              className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-primary-soft transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(category)}
                              title={`Edit ${category.categoryName}`}
                              aria-label={`Edit ${category.categoryName}`}
                              className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-primary-soft transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {isActive && (
                              <button
                                type="button"
                                onClick={() => setDeactivateTarget(category)}
                                title={`Deactivate ${category.categoryName}`}
                                aria-label={`Deactivate ${category.categoryName}`}
                                className="p-1.5 rounded text-awn-text-secondary hover:text-awn-warning hover:bg-awn-warning-soft transition-colors cursor-pointer"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(category)}
                              title={`Delete ${category.categoryName}`}
                              aria-label={`Delete ${category.categoryName}`}
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
                {isRtl ? (
                  <>
                    عرض{' '}
                    <strong className="font-semibold text-awn-text-primary">
                      {formatNumber(categoriesData.items.length)}
                    </strong>{' '}
                    من أصل{' '}
                    <strong className="font-semibold text-awn-text-primary">
                      {formatNumber(categoriesData.pagination.totalItems)}
                    </strong>{' '}
                    سجل
                  </>
                ) : (
                  <>
                    Showing{' '}
                    <strong className="font-semibold text-awn-text-primary">
                      {categoriesData.items.length}
                    </strong>{' '}
                    of{' '}
                    <strong className="font-semibold text-awn-text-primary">
                      {categoriesData.pagination.totalItems}
                    </strong>{' '}
                    displayed records ·{' '}
                    <strong className="font-semibold text-awn-text-primary">
                      {categoriesData.summaryTotalLabel}
                    </strong>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => fetchCategories(currentPage - 1)}
                  leftIcon={isRtl ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                >
                  {isRtl ? 'السابق' : 'Previous'}
                </Button>
                <span className="px-2.5 py-1 font-mono text-xs text-awn-text-primary tabular-nums">
                  {isRtl
                    ? `صفحة ${formatNumber(currentPage)} من ${formatNumber(categoriesData.pagination.totalPages)}`
                    : `Page ${currentPage} of ${categoriesData.pagination.totalPages}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= categoriesData.pagination.totalPages}
                  onClick={() => fetchCategories(currentPage + 1)}
                  rightIcon={isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                >
                  {isRtl ? 'التالي' : 'Next'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ========================================================================
          CATEGORY DETAILS DRAWER (Section 5)
          ======================================================================== */}
      <Drawer
        isOpen={detailsOpen && Boolean(selectedCategory)}
        onClose={() => setDetailsOpen(false)}
        title={
          selectedCategory
            ? `${selectedCategory.categoryId} · ${selectedCategory.categoryName}`
            : 'Category Details'
        }
        subtitle="Master · Asset Category Specification"
        size="lg"
        footer={
          selectedCategory ? (
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {selectedCategory.status === 'Active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Ban className="w-3.5 h-3.5" />}
                    onClick={() => setDeactivateTarget(selectedCategory)}
                  >
                    Deactivate Category
                  </Button>
                )}
                <Button
                  variant="dangerOutline"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => setDeleteTarget(selectedCategory)}
                >
                  Delete Category
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
                  onClick={() => handleOpenEditModal(selectedCategory)}
                >
                  Edit Category
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {selectedCategory && (
          <div className="space-y-6">
            {/* Category Summary Banner */}
            <div className="p-4 rounded-lg bg-awn-surface-alt border border-awn-border flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-awn-text-muted tabular-nums">
                  {selectedCategory.categoryId}
                </div>
                <div className="text-base font-semibold text-awn-text-primary mt-0.5">
                  {selectedCategory.categoryName}
                </div>
                <div className="text-xs text-awn-text-secondary mt-1">
                  Created Date: {selectedCategory.createdDate}
                </div>
              </div>
              <StatusBadge
                label={selectedCategory.status}
                tone={selectedCategory.statusTone}
              />
            </div>

            {/* Category Details Attributes */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-awn-text-primary">
                Category Details
              </h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Category ID</dt>
                  <dd className="font-mono font-semibold text-awn-text-primary mt-1 tabular-nums">
                    {selectedCategory.categoryId}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Category Name</dt>
                  <dd className="font-semibold text-awn-text-primary mt-1">
                    {selectedCategory.categoryName}
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge
                      label={selectedCategory.status}
                      tone={selectedCategory.statusTone}
                    />
                  </dd>
                </div>
                <div className="p-3.5 rounded-md border border-awn-border">
                  <dt className="text-awn-text-muted">Created Date</dt>
                  <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                    {selectedCategory.createdDate}
                  </dd>
                </div>
                <div className="sm:col-span-2 p-3.5 rounded-md border border-awn-border bg-awn-surface-alt">
                  <dt className="text-awn-text-muted">Description</dt>
                  <dd className="font-medium text-awn-text-primary mt-1 leading-relaxed">
                    {selectedCategory.description || 'No description provided.'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================================
          CREATE NEW ASSET CATEGORY / EDIT CATEGORY MODAL (Sections 6, 7, 8)
          ======================================================================== */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={
          formMode === 'create' ? 'Create New Asset Category' : 'Edit Category'
        }
        description={
          formMode === 'create'
            ? 'Define a new master asset category. Category ID is autogenerated by the system.'
            : `Update the name and description for category ${formData.categoryId}.`
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
            title="Category Information"
            description="Enter the category details below."
            columns={1}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Category ID"
                value={formData.categoryId}
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
              label="Category Name"
              required
              placeholder="e.g., IT Equipment"
              value={formData.categoryName}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({ ...prev, categoryName: val }));
                if (formErrors.categoryName) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.categoryName;
                    return next;
                  });
                }
              }}
              error={formErrors.categoryName}
            />

            <Textarea
              label="Description"
              rows={3}
              placeholder="e.g., Computers, laptops, printers, etc."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </FormSection>
        </form>
      </Modal>

      {/* ========================================================================
          DEACTIVATE CATEGORY CONFIRMATION DIALOG (Section 9)
          ======================================================================== */}
      <ConfirmDialog
        isOpen={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Category"
        description="Confirming this action will change the category status from Active to Inactive. The category record will remain preserved in the master dataset."
        itemSummary={
          deactivateTarget
            ? `${deactivateTarget.categoryId} — ${deactivateTarget.categoryName}`
            : ''
        }
        confirmLabel="Deactivate Category"
        loading={submitting}
      />

      {/* ========================================================================
          DELETE CATEGORY CONFIRMATION DIALOG (Section 10)
          ======================================================================== */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action will remove the category from the Asset Categories dataset."
        itemSummary={
          deleteTarget
            ? `${deleteTarget.categoryId} — ${deleteTarget.categoryName} (${deleteTarget.description})`
            : ''
        }
        confirmLabel="Delete Category"
        loading={submitting}
      />
    </div>
  );
}
