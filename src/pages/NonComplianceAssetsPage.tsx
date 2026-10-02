import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Ban,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  FileCheck2,
  FileText,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Upload,
  UserPlus,
} from 'lucide-react';
import { assetModuleService } from '../services/assetModuleService.ts';
import { useToast } from '../hooks/useToast.tsx';
import { PageHeader } from '../components/ui/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { FormSection } from '../components/ui/FormSection.tsx';
import { Input } from '../components/ui/Input.tsx';
import { Select } from '../components/ui/Select.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { ConfirmDialog, Modal } from '../components/ui/Modal.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { TableSkeleton } from '../components/ui/LoadingState.tsx';
import type {
  NonComplianceAsset,
  NonComplianceAssetFormData,
  NonComplianceDocumentId,
  RouterQueryParams,
  ValidationErrors,
} from '../types/index.ts';

export type NonComplianceFlowStep =
  | 'list'
  | 'choose-documents'
  | 'add-form'
  | 'details';

const DEFAULT_SELECTED_DOCUMENTS: NonComplianceDocumentId[] = [
  'Financial & Ownership Details',
  'Warranty Document',
];

const EMPTY_NON_COMPLIANCE_FORM: NonComplianceAssetFormData = {
  basicDetails: {
    language: 'English',
    customer: 'Advanced Tech Co.',
    business: 'Enterprise IT & Digital Workplace',
    assetsCategory: 'Compliance',
    compliance: 'Non-Compliance',
    assetsType: 'Vehicle',
  },
  assetIdentification: {
    language: 'English',
    assetName: '',
    serialNumber: '',
    modelBrand: '',
    assetType: 'Owned',
    purchaseDate: '',
    warrantyExpiry: '',
    assignedTo: 'Tariq Al-Mansoor',
  },
  documentsInfo: {
    template: 'Standard IT & Financial Custody Template (Financial & Warranty)',
  },
  financialOwnership: {
    purchaseValueSar: '',
    vendorSupplier: '',
    assetLocation: 'Riyadh HQ - Floor 3',
    condition: 'Good',
    usefulLifeYears: '',
    depreciationMethod: 'Straight Line',
    currentBookValue: '3,200 SAR as of 2025',
  },
  warrantyDocument: {
    documentName: '',
    documentNumber: '',
    issueDate: '',
    renewalDate: '',
    expiryDate: '',
    validityDate: '',
    uploadDocument: '',
  },
};

function cloneForm(form: NonComplianceAssetFormData): NonComplianceAssetFormData {
  return JSON.parse(JSON.stringify(form)) as NonComplianceAssetFormData;
}

interface UploadDocumentFieldProps {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

/**
 * Reusable Upload Document Control (Frontend-only typed attachment reference)
 */
function UploadDocumentField({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = 'e.g., FitnessCard.pdf',
}: UploadDocumentFieldProps) {
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file.name);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-awn-text-primary flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-awn-error">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            error={error}
            leftIcon={<FileText className="w-3.5 h-3.5" />}
          />
        </div>
        <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-awn-surface-alt border border-awn-border hover:border-awn-border-strong text-xs font-medium text-awn-text-primary cursor-pointer shrink-0 transition-colors">
          <Upload className="w-3.5 h-3.5 text-awn-primary" aria-hidden="true" />
          <span>Upload Document</span>
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleFilePick}
          />
        </label>
      </div>
    </div>
  );
}

interface NonComplianceProgressHeaderProps {
  currentStep: NonComplianceFlowStep;
  onStepClick?: (step: NonComplianceFlowStep) => void;
  isEditingExisting: boolean;
}

/**
 * Step Progress Bar maintaining clear context across:
 * Add New Non-Compliance → Choose Documents → Non-Compliance Asset Details
 */
function NonComplianceProgressHeader({
  currentStep,
  onStepClick,
  isEditingExisting,
}: NonComplianceProgressHeaderProps) {
  const steps: Array<{
    id: NonComplianceFlowStep;
    stepNum: string;
    label: string;
    subtitle: string;
  }> = [
    {
      id: 'add-form',
      stepNum: '01',
      label: isEditingExisting ? 'Edit Non-Compliance Asset' : 'Add New Non-Compliance',
      subtitle: 'Basic details, identification & documents',
    },
    {
      id: 'choose-documents',
      stepNum: '02',
      label: 'Choose Documents',
      subtitle: 'Financial & Ownership, Warranty, Proof',
    },
    {
      id: 'details',
      stepNum: '03',
      label: 'Non-Compliance Asset Details',
      subtitle: 'Summary, custody & lifecycle actions',
    },
  ];

  const activeIdx = steps.findIndex((s) => s.id === currentStep);

  return (
    <div
      aria-label="Non-Compliance asset registration progress"
      className="bg-awn-surface border border-awn-border rounded-lg p-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step, idx) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = idx < activeIdx;
          const canNavigate =
            currentStep !== 'details' &&
            (step.id === 'add-form' || step.id === 'choose-documents');

          return (
            <button
              key={step.id}
              type="button"
              disabled={!canNavigate}
              onClick={() => canNavigate && onStepClick?.(step.id)}
              className={`text-left p-3 rounded-md border transition-colors flex items-center gap-3 ${
                isCurrent
                  ? 'bg-awn-primary-soft border-awn-primary'
                  : isCompleted
                  ? 'bg-awn-surface-alt border-awn-border'
                  : 'bg-awn-surface border-awn-border opacity-75'
              } ${canNavigate ? 'cursor-pointer hover:border-awn-primary' : 'cursor-default'}`}
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-semibold shrink-0 tabular-nums ${
                  isCurrent
                    ? 'bg-awn-primary text-awn-on-primary'
                    : isCompleted
                    ? 'bg-awn-success-soft text-awn-success border border-awn-success-border'
                    : 'bg-awn-surface-alt text-awn-text-muted border border-awn-border'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.stepNum}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-awn-text-primary truncate">
                  {step.label}
                </div>
                <div className="text-[11px] text-awn-text-secondary truncate">
                  {step.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface NonComplianceAssetsPageProps {
  queryParams?: RouterQueryParams;
  onNavigate: (path: string) => void;
}

export default function NonComplianceAssetsPage({
  queryParams = {},
  onNavigate,
}: NonComplianceAssetsPageProps) {
  const { showToast } = useToast();
  const docOptions = assetModuleService.getNonComplianceDocumentOptions();
  const selectOpts = assetModuleService.getNonComplianceSelectOptions();

  // Flow steps: 'list' | 'add-form' | 'choose-documents' | 'details'
  const [flowStep, setFlowStep] = useState<NonComplianceFlowStep>(() =>
    queryParams?.flow === 'new' ? 'add-form' : 'list'
  );

  // List State
  const [nonComplianceList, setNonComplianceList] = useState<NonComplianceAsset[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Choose Documents State
  // Default Selected Documents: Financial & Ownership Details, Warranty Document
  const [selectedDocuments, setSelectedDocuments] = useState<NonComplianceDocumentId[]>(
    () => [...DEFAULT_SELECTED_DOCUMENTS]
  );
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');

  // Form State
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NonComplianceAssetFormData>(() =>
    cloneForm(EMPTY_NON_COMPLIANCE_FORM)
  );
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Details & Modals State
  const [activeAsset, setActiveAsset] = useState<NonComplianceAsset | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lastSubmissionBanner, setLastSubmissionBanner] = useState<{
    type: 'submitted' | 'draft';
    title: string;
    message: string;
  } | null>(null);

  // Reassign Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedReassignEmployee, setSelectedReassignEmployee] = useState('');
  const [reassignLocation, setReassignLocation] = useState('');

  // Retire Dialog State
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);
  const [retireReason, setRetireReason] = useState('');

  const loadNonComplianceList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await assetModuleService.getNonComplianceAssets({
        search: searchQuery,
        status: statusFilter,
      });
      setNonComplianceList(res.items);
    } finally {
      setLoadingList(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadNonComplianceList();
  }, [loadNonComplianceList]);

  // Trigger Add New Non-Compliance automatically when navigated with ?flow=new, or open Details when navigated with ?assetId=...
  useEffect(() => {
    if (queryParams?.flow === 'new') {
      setEditingAssetId(null);
      setSelectedDocuments([...DEFAULT_SELECTED_DOCUMENTS]);
      setFormData(cloneForm(EMPTY_NON_COMPLIANCE_FORM));
      setFormErrors({});
      setLastSubmissionBanner(null);
      setSuccessModalOpen(false);
      setFlowStep('add-form');
    } else if (queryParams?.assetId) {
      assetModuleService.getNonComplianceAssetById(queryParams.assetId).then((found) => {
        if (found) {
          setActiveAsset(found);
          setEditingAssetId(found.id);
          setLastSubmissionBanner(null);
          setSuccessModalOpen(false);
          setFlowStep('details');
        }
      });
    }
  }, [queryParams?.flow, queryParams?.assetId]);

  // ============================================================================
  // CHOOSE DOCUMENTS HANDLERS
  // ============================================================================
  const toggleDocumentSelection = (docId: NonComplianceDocumentId) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId) ? prev.filter((item) => item !== docId) : [...prev, docId]
    );
  };

  const handleResetAllDocuments = () => {
    setSelectedDocuments([...DEFAULT_SELECTED_DOCUMENTS]);
    setDocumentSearchQuery('');
    showToast({
      title: 'Documents Reset',
      description:
        'Selected Documents reset to Financial & Ownership Details and Warranty Document.',
      variant: 'info',
    });
  };

  const handleChooseDocumentsSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedDocuments.length === 0) {
      showToast({
        title: 'Select at least one document',
        description: 'Please select at least one document section before continuing.',
        variant: 'warning',
      });
      return;
    }
    setFlowStep('add-form');
    showToast({
      title: 'Documents Updated',
      description: `${selectedDocuments.length} document section(s) active in the form.`,
      variant: 'info',
    });
  };

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================
  const updateSectionField = <
    TSection extends keyof NonComplianceAssetFormData,
    TField extends keyof NonComplianceAssetFormData[TSection] & string,
  >(
    section: TSection,
    field: TField,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    const errorKey = `${String(section)}.${field}`;
    if (formErrors[errorKey]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  };

  const handleTemplateChange = (templateName: string) => {
    updateSectionField('documentsInfo', 'template', templateName);
    if (
      templateName ===
      'Standard IT & Financial Custody Template (Financial & Warranty)'
    ) {
      setSelectedDocuments(['Financial & Ownership Details', 'Warranty Document']);
    } else if (
      templateName === 'Complete Non-Compliance Asset Package (All Documents)'
    ) {
      setSelectedDocuments([
        'Warranty Document',
        'Financial & Ownership Details',
        'Proof of Ownership',
        'Driving License',
      ]);
    } else if (templateName === 'Financial & Ownership Only') {
      setSelectedDocuments(['Financial & Ownership Details']);
    }
  };

  const handlePopulateDemoValues = () => {
    setFormData({
      basicDetails: {
        language: 'English',
        customer: 'Advanced Tech Co.',
        business: 'Enterprise IT & Digital Workplace',
        assetsCategory: 'Compliance',
        compliance: 'Non-Compliance',
        assetsType: 'Vehicle',
      },
      assetIdentification: {
        language: 'English',
        assetName: 'Company Laptop - Dell Latitude 5440',
        serialNumber: 'SN-123456789',
        modelBrand: 'Dell Latitude 5440',
        assetType: 'Owned',
        purchaseDate: '2025-01-15',
        warrantyExpiry: '2028-01-14',
        assignedTo: 'Tariq Al-Mansoor',
      },
      documentsInfo: {
        template:
          'Standard IT & Financial Custody Template (Financial & Warranty)',
      },
      financialOwnership: {
        purchaseValueSar: '4,500 SAR',
        vendorSupplier: 'Jarir Bookstore',
        assetLocation: 'Riyadh HQ - Floor 3',
        condition: 'Good',
        usefulLifeYears: '3 Years',
        depreciationMethod: 'Straight Line',
        currentBookValue: '3,200 SAR as of 2025',
      },
      warrantyDocument: {
        documentName: 'MOT Test',
        documentNumber: 'WAR-DL5440-2025-091',
        issueDate: '2025-01-15',
        renewalDate: '2027-12-15',
        expiryDate: '2028-01-14',
        validityDate: '2028-01-14',
        uploadDocument: 'FitnessCard.pdf',
      },
    });
    setSelectedDocuments(['Financial & Ownership Details', 'Warranty Document']);
    setFormErrors({});
    showToast({
      title: 'Demo values populated',
      description:
        'Populated with exact supplied demo values (Company Laptop - Dell Latitude 5440, SN-123456789, Jarir Bookstore, MOT Test, FitnessCard.pdf).',
      variant: 'info',
    });
  };

  const validateNonComplianceForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Basic Details required fields
    if (!formData.basicDetails.assetsType.trim()) {
      errors['basicDetails.assetsType'] = 'Assets type is required.';
    }

    // Asset Identification required fields
    if (!formData.assetIdentification.assetName.trim()) {
      errors['assetIdentification.assetName'] = 'Asset Name is required.';
    }
    if (!formData.assetIdentification.serialNumber.trim()) {
      errors['assetIdentification.serialNumber'] = 'Serial Number is required.';
    }

    // Financial & Ownership Details required fields (when selected)
    if (selectedDocuments.includes('Financial & Ownership Details')) {
      if (!formData.financialOwnership.purchaseValueSar.trim()) {
        errors['financialOwnership.purchaseValueSar'] =
          'Purchase Value (SAR) is required.';
      }
      if (!formData.financialOwnership.condition.trim()) {
        errors['financialOwnership.condition'] = 'Condition is required.';
      }
      if (!formData.financialOwnership.usefulLifeYears.trim()) {
        errors['financialOwnership.usefulLifeYears'] =
          'Useful Life (in years) is required.';
      }
    }

    // Warranty Document required fields (when selected)
    if (selectedDocuments.includes('Warranty Document')) {
      if (!formData.warrantyDocument.documentNumber.trim()) {
        errors['warrantyDocument.documentNumber'] = 'Document Number is required.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAsDraft = async () => {
    setSubmitting(true);
    try {
      const saved = await assetModuleService.saveNonComplianceAsset(
        {
          selectedDocuments,
          ...formData,
        },
        { isDraft: true, existingId: editingAssetId }
      );
      setActiveAsset(saved);
      setEditingAssetId(saved.id);
      setSuccessModalOpen(false);
      setLastSubmissionBanner({
        type: 'draft',
        title: `Saved As Draft (${saved.code})`,
        message: `Draft ${saved.code} has been preserved in mock service state. You can inspect its current details below or click "Edit Asset" at any time to complete and submit.`,
      });
      await loadNonComplianceList();
      showToast({
        title: `Saved As Draft (${saved.code})`,
        description:
          'Entered Non-Compliance asset values have been preserved as a draft.',
        variant: 'info',
      });
      setFlowStep('details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitNonComplianceAsset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateNonComplianceForm()) {
      showToast({
        title: 'Required fields missing',
        description:
          'Please complete the highlighted required fields or use "Save As Draft" to continue later.',
        variant: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      const saved = await assetModuleService.saveNonComplianceAsset(
        {
          selectedDocuments,
          ...formData,
        },
        { isDraft: false, existingId: editingAssetId }
      );
      const exactSuccessMessage =
        'Asset Added Successfully! The asset has been recorded in the system. You can now assign it to an employee, track its status, and manage it from the Assets dashboard.';

      setActiveAsset(saved);
      setEditingAssetId(saved.id);
      setLastSubmissionBanner({
        type: 'submitted',
        title: 'Asset Added Successfully!',
        message: exactSuccessMessage,
      });
      setSuccessModalOpen(true);
      await loadNonComplianceList();
      showToast({
        title: 'Asset Added Successfully!',
        description:
          'The asset has been recorded in the system. You can now assign it to an employee, track its status, and manage it from the Assets dashboard.',
        variant: 'success',
      });
      setFlowStep('details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNewNonComplianceAsset = () => {
    setEditingAssetId(null);
    setSelectedDocuments([...DEFAULT_SELECTED_DOCUMENTS]);
    setFormData(cloneForm(EMPTY_NON_COMPLIANCE_FORM));
    setFormErrors({});
    setLastSubmissionBanner(null);
    setSuccessModalOpen(false);
    setFlowStep('add-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAssetDetails = (asset: NonComplianceAsset) => {
    setActiveAsset(asset);
    setEditingAssetId(asset.id);
    setLastSubmissionBanner(null);
    setSuccessModalOpen(false);
    setFlowStep('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditExistingAsset = (asset: NonComplianceAsset) => {
    setActiveAsset(asset);
    setEditingAssetId(asset.id);
    setSelectedDocuments(
      Array.isArray(asset.selectedDocuments) && asset.selectedDocuments.length > 0
        ? asset.selectedDocuments
        : [...DEFAULT_SELECTED_DOCUMENTS]
    );
    setFormData({
      basicDetails: {
        ...EMPTY_NON_COMPLIANCE_FORM.basicDetails,
        ...(asset.basicDetails || {}),
      },
      assetIdentification: {
        ...EMPTY_NON_COMPLIANCE_FORM.assetIdentification,
        ...(asset.assetIdentification || {}),
      },
      documentsInfo: {
        ...EMPTY_NON_COMPLIANCE_FORM.documentsInfo,
        ...(asset.documentsInfo || {}),
      },
      financialOwnership: {
        ...EMPTY_NON_COMPLIANCE_FORM.financialOwnership,
        ...(asset.financialOwnership || {}),
      },
      warrantyDocument: {
        ...EMPTY_NON_COMPLIANCE_FORM.warrantyDocument,
        ...(asset.warrantyDocument || {}),
      },
    });
    setFormErrors({});
    setLastSubmissionBanner(null);
    setSuccessModalOpen(false);
    setFlowStep('add-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReassignModal = (asset: NonComplianceAsset) => {
    const currentEmp = asset.assetIdentification?.assignedTo || '';
    setSelectedReassignEmployee(
      currentEmp || (selectOpts.employees[0]?.value ?? 'Tariq Al-Mansoor')
    );
    setReassignLocation(
      asset.financialOwnership?.assetLocation || 'Riyadh HQ - Floor 3'
    );
    setReassignModalOpen(true);
  };

  const handleConfirmReassign = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeAsset || !selectedReassignEmployee) return;

    setSubmitting(true);
    try {
      const matchedEmp = selectOpts.employees.find(
        (emp) => emp.value === selectedReassignEmployee
      );
      const updated = await assetModuleService.reassignNonComplianceAsset(
        activeAsset.id,
        {
          assignedTo: selectedReassignEmployee,
          assignedRole: matchedEmp?.role,
          department: matchedEmp?.department,
          location: reassignLocation || matchedEmp?.location,
        }
      );
      setActiveAsset(updated);
      setReassignModalOpen(false);
      await loadNonComplianceList();
      showToast({
        title: `Asset ${updated.code} Reassigned`,
        description: `Assigned to ${updated.assetIdentification.assignedTo} (${updated.department || 'Enterprise IT'}).`,
        variant: 'success',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRetire = async () => {
    if (!activeAsset) return;
    setSubmitting(true);
    try {
      const updated = await assetModuleService.retireNonComplianceAsset(
        activeAsset.id,
        {
          reason: retireReason,
        }
      );
      setActiveAsset(updated);
      setRetireDialogOpen(false);
      setRetireReason('');
      await loadNonComplianceList();
      showToast({
        title: `Asset ${updated.code} Retired`,
        description:
          'The Non-Compliance asset has been deactivated and marked as Retired across the Assets registry.',
        variant: 'info',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocOptions = docOptions.filter((doc) => {
    const q = documentSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      doc.label.toLowerCase().includes(q) ||
      doc.description.toLowerCase().includes(q)
    );
  });

  // ============================================================================
  // DEDICATED STEP: CHOOSE DOCUMENTS
  // ============================================================================
  if (flowStep === 'choose-documents') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => setFlowStep('add-form')}
          >
            Back to Add New Non-Compliance
          </Button>
          <span className="text-xs text-awn-text-muted">
            Step 2 of 3 · Choose Documents
          </span>
        </div>

        <NonComplianceProgressHeader
          currentStep="choose-documents"
          onStepClick={setFlowStep}
          isEditingExisting={Boolean(editingAssetId)}
        />

        <PageHeader
          title="Choose Documents"
          description="Select or deselect the document sections required for this Non-Compliance asset."
          secondaryActions={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleResetAllDocuments}
            >
              Reset All
            </Button>
          }
        />

        <form onSubmit={handleChooseDocumentsSubmit} className="space-y-6">
          <Card
            title="Selected Documents"
            description="Currently selected document sections included in the Non-Compliance Asset form."
          >
            {selectedDocuments.length === 0 ? (
              <p className="text-xs text-awn-text-muted">
                No documents selected. Choose at least one document below.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {selectedDocuments.map((docId) => (
                  <div
                    key={docId}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-awn-primary-soft border border-awn-primary text-xs font-semibold text-awn-primary"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{docId}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Available Documents"
            description="Search and toggle available document sections for this asset."
            actions={
              <div className="w-64">
                <Input
                  placeholder="Search Document"
                  aria-label="Search Document"
                  value={documentSearchQuery}
                  onChange={(e) => setDocumentSearchQuery(e.target.value)}
                  onClear={() => setDocumentSearchQuery('')}
                  leftIcon={<Search className="w-3.5 h-3.5" />}
                />
              </div>
            }
            footer={
              <>
                <Button variant="outline" onClick={handleResetAllDocuments}>
                  Reset All
                </Button>
                <Button variant="outline" onClick={() => setFlowStep('add-form')}>
                  Go Back
                </Button>
                <Button type="submit" variant="primary">
                  Submit
                </Button>
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDocOptions.map((doc) => {
                const isSelected = selectedDocuments.includes(doc.id);
                return (
                  <label
                    key={doc.id}
                    className={`p-4 rounded-lg border transition-colors flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'bg-awn-primary-soft border-awn-primary'
                        : 'bg-awn-surface border-awn-border hover:bg-awn-surface-alt'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDocumentSelection(doc.id)}
                      className="mt-1 h-4 w-4 rounded border-awn-border text-awn-primary focus:ring-awn-primary cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-awn-text-primary">
                          {doc.label}
                        </span>
                        {isSelected && (
                          <span className="text-[11px] font-semibold text-awn-primary">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-awn-text-secondary mt-1 leading-relaxed">
                        {doc.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </Card>
        </form>
      </div>
    );
  }

  // ============================================================================
  // STEP 1 & 2: ADD NEW NON-COMPLIANCE / EDIT NON-COMPLIANCE FORM
  // ============================================================================
  if (flowStep === 'add-form') {
    const showFinancialSection = selectedDocuments.includes(
      'Financial & Ownership Details'
    );
    const showWarrantySection = selectedDocuments.includes('Warranty Document');

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => setFlowStep('list')}
          >
            Go Back to Non-Compliance Assets
          </Button>
          <span className="text-xs text-awn-text-muted">
            {editingAssetId
              ? `Editing ${editingAssetId}`
              : 'New Asset → Non-Compliance'}
          </span>
        </div>

        <NonComplianceProgressHeader
          currentStep="add-form"
          onStepClick={setFlowStep}
          isEditingExisting={Boolean(editingAssetId)}
        />

        {/* Exact required title and description from Section 3 */}
        <PageHeader
          title="Add New Non-Compliance"
          description="Add A New Business Owner By Entering Personal And Compliance Details, Assign Them To A Business Profile To Manage Ownership And Responsibilities Efficiently"
          secondaryActions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlowStep('choose-documents')}
              >
                Choose Documents ({selectedDocuments.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePopulateDemoValues}
              >
                Fill Demo Values
              </Button>
            </div>
          }
        />

        <form onSubmit={handleSubmitNonComplianceAsset} noValidate className="space-y-6">
          <Card>
            <div className="divide-y divide-awn-border">
              {/* 1. FORM SECTION: BASIC DETAILS */}
              <FormSection
                stepNumber="01"
                title="Basic Details"
                description="Specify language, customer, business unit, category, compliance scope, and assets type."
                columns={2}
              >
                <Select
                  label="Language"
                  options={selectOpts.languages}
                  value={formData.basicDetails.language}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'language', e.target.value)
                  }
                />
                <Select
                  label="Customer"
                  options={selectOpts.customers}
                  value={formData.basicDetails.customer}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'customer', e.target.value)
                  }
                />
                <Select
                  label="Business"
                  options={selectOpts.businesses}
                  value={formData.basicDetails.business}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'business', e.target.value)
                  }
                />
                <Select
                  label="Assets Category"
                  options={selectOpts.assetCategories}
                  value={formData.basicDetails.assetsCategory}
                  onChange={(e) =>
                    updateSectionField(
                      'basicDetails',
                      'assetsCategory',
                      e.target.value
                    )
                  }
                />
                <Select
                  label="Compliance"
                  options={selectOpts.complianceOptions}
                  value={formData.basicDetails.compliance}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'compliance', e.target.value)
                  }
                />
                <Select
                  label="Assets type"
                  required
                  options={selectOpts.assetsTypes}
                  value={formData.basicDetails.assetsType}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'assetsType', e.target.value)
                  }
                  error={formErrors['basicDetails.assetsType']}
                />
              </FormSection>

              {/* 2. FORM SECTION: ASSET IDENTIFICATION */}
              <FormSection
                stepNumber="02"
                title="Asset Identification"
                description="Enter hardware/asset name, serial number, brand/model, ownership type, warranty dates, and assigned employee."
                columns={2}
              >
                <Select
                  label="Language"
                  options={selectOpts.languages}
                  value={formData.assetIdentification.language}
                  onChange={(e) =>
                    updateSectionField(
                      'assetIdentification',
                      'language',
                      e.target.value
                    )
                  }
                />
                <Input
                  label="Asset Name"
                  required
                  placeholder="Company Laptop - Dell Latitude 5440"
                  value={formData.assetIdentification.assetName}
                  onChange={(e) =>
                    updateSectionField(
                      'assetIdentification',
                      'assetName',
                      e.target.value
                    )
                  }
                  error={formErrors['assetIdentification.assetName']}
                />
                <Input
                  label="Serial Number"
                  required
                  placeholder="SN-123456789"
                  value={formData.assetIdentification.serialNumber}
                  onChange={(e) =>
                    updateSectionField(
                      'assetIdentification',
                      'serialNumber',
                      e.target.value
                    )
                  }
                  error={formErrors['assetIdentification.serialNumber']}
                />
                <Input
                  label="Model / Brand"
                  placeholder="Dell Latitude / Apple iPhone 14"
                  value={formData.assetIdentification.modelBrand}
                  onChange={(e) =>
                    updateSectionField(
                      'assetIdentification',
                      'modelBrand',
                      e.target.value
                    )
                  }
                />
                <Select
                  label="Asset Type"
                  options={selectOpts.ownershipAssetTypes}
                  value={formData.assetIdentification.assetType}
                  onChange={(e) =>
                    updateSectionField(
                      'assetIdentification',
                      'assetType',
                      e.target.value
                    )
                  }
                />
                <Input
                  label="Purchase Date"
                  type="date"
                  value={formData.assetIdentification.purchaseDate}
                  onChange={(e) =>
                    updateSectionField(
                      'assetIdentification',
                      'purchaseDate',
                      e.target.value
                    )
                  }
                />
                <Input
                  label="Warranty Expiry"
                  type="date"
                  value={formData.assetIdentification.warrantyExpiry}
                  onChange={(e) =>
                    updateSectionField(
                      'assetIdentification',
                      'warrantyExpiry',
                      e.target.value
                    )
                  }
                />
                <Select
                  label="Assigned To"
                  options={selectOpts.employees}
                  value={formData.assetIdentification.assignedTo}
                  onChange={(e) =>
                    updateSectionField(
                      'assetIdentification',
                      'assignedTo',
                      e.target.value
                    )
                  }
                />
              </FormSection>

              {/* 3. FORM SECTION: DOCUMENTS INFORMATION & CHOOSE DOCUMENTS */}
              <FormSection
                stepNumber="03"
                title="Documents Information"
                description="Choose a document template and select/deselect required document sections."
                columns={1}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Choose Template"
                    options={selectOpts.templates}
                    value={formData.documentsInfo.template}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-awn-text-primary">
                      Search Document
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Search Document"
                          aria-label="Search Document"
                          value={documentSearchQuery}
                          onChange={(e) => setDocumentSearchQuery(e.target.value)}
                          onClear={() => setDocumentSearchQuery('')}
                          leftIcon={<Search className="w-3.5 h-3.5" />}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={handleResetAllDocuments}
                      >
                        Reset All
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Selected Documents & Available Documents Panel */}
                <div className="mt-4 p-4 rounded-lg bg-awn-surface-alt border border-awn-border space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-semibold text-awn-text-primary">
                        Selected Documents
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {selectedDocuments.length === 0 ? (
                          <span className="text-xs text-awn-text-muted">
                            None selected
                          </span>
                        ) : (
                          selectedDocuments.map((docId) => (
                            <span
                              key={docId}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-awn-primary-soft border border-awn-primary text-xs font-semibold text-awn-primary"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>{docId}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-awn-border">
                    <h4 className="text-xs font-semibold text-awn-text-primary mb-2.5">
                      Available Documents
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredDocOptions.map((doc) => {
                        const isSelected = selectedDocuments.includes(doc.id);
                        return (
                          <label
                            key={doc.id}
                            className={`p-3 rounded-md border transition-colors flex items-start gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-awn-surface border-awn-primary'
                                : 'bg-awn-surface border-awn-border hover:border-awn-border-strong'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDocumentSelection(doc.id)}
                              className="mt-0.5 h-4 w-4 rounded border-awn-border text-awn-primary focus:ring-awn-primary cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-awn-text-primary">
                                {doc.label}
                              </div>
                              <p className="text-[11px] text-awn-text-secondary mt-0.5 leading-relaxed">
                                {doc.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* 4. FORM SECTION: FINANCIAL & OWNERSHIP DETAILS */}
              {showFinancialSection && (
                <FormSection
                  stepNumber="04"
                  title="Financial & Ownership Details"
                  description="Capture purchase value, supplier, physical location, condition, useful life, and depreciation method."
                  columns={2}
                >
                  <Input
                    label="Purchase Value (SAR)"
                    required
                    placeholder="e.g., 4,500 SAR"
                    value={formData.financialOwnership.purchaseValueSar}
                    onChange={(e) =>
                      updateSectionField(
                        'financialOwnership',
                        'purchaseValueSar',
                        e.target.value
                      )
                    }
                    error={formErrors['financialOwnership.purchaseValueSar']}
                  />
                  <Input
                    label="Vendor / Supplier"
                    placeholder="e.g., Jarir Bookstore"
                    value={formData.financialOwnership.vendorSupplier}
                    onChange={(e) =>
                      updateSectionField(
                        'financialOwnership',
                        'vendorSupplier',
                        e.target.value
                      )
                    }
                  />
                  <Input
                    label="Asset Location"
                    placeholder="Riyadh HQ - Floor 3"
                    value={formData.financialOwnership.assetLocation}
                    onChange={(e) =>
                      updateSectionField(
                        'financialOwnership',
                        'assetLocation',
                        e.target.value
                      )
                    }
                  />
                  <Select
                    label="Condition"
                    required
                    options={selectOpts.conditions}
                    value={formData.financialOwnership.condition}
                    onChange={(e) =>
                      updateSectionField(
                        'financialOwnership',
                        'condition',
                        e.target.value
                      )
                    }
                    error={formErrors['financialOwnership.condition']}
                  />
                  <Input
                    label="Useful Life (in years)"
                    required
                    placeholder="e.g., 3 Years"
                    value={formData.financialOwnership.usefulLifeYears}
                    onChange={(e) =>
                      updateSectionField(
                        'financialOwnership',
                        'usefulLifeYears',
                        e.target.value
                      )
                    }
                    error={formErrors['financialOwnership.usefulLifeYears']}
                  />
                  <Select
                    label="Depreciation Method"
                    options={selectOpts.depreciationMethods}
                    value={formData.financialOwnership.depreciationMethod}
                    onChange={(e) =>
                      updateSectionField(
                        'financialOwnership',
                        'depreciationMethod',
                        e.target.value
                      )
                    }
                  />
                </FormSection>
              )}

              {/* 5. FORM SECTION: WARRANTY DOCUMENT */}
              {showWarrantySection && (
                <FormSection
                  stepNumber="05"
                  title="Warranty Document"
                  description="Record warranty document metadata, reference number, key dates, and document file reference."
                  columns={2}
                >
                  <Input
                    label="Document Name"
                    placeholder="e.g., MOT Test"
                    value={formData.warrantyDocument.documentName}
                    onChange={(e) =>
                      updateSectionField(
                        'warrantyDocument',
                        'documentName',
                        e.target.value
                      )
                    }
                  />
                  <Input
                    label="Document Number"
                    required
                    placeholder="e.g., WAR-DL5440-2025-091"
                    value={formData.warrantyDocument.documentNumber}
                    onChange={(e) =>
                      updateSectionField(
                        'warrantyDocument',
                        'documentNumber',
                        e.target.value
                      )
                    }
                    error={formErrors['warrantyDocument.documentNumber']}
                  />
                  <Input
                    label="Issue Date"
                    type="date"
                    value={formData.warrantyDocument.issueDate}
                    onChange={(e) =>
                      updateSectionField(
                        'warrantyDocument',
                        'issueDate',
                        e.target.value
                      )
                    }
                  />
                  <Input
                    label="Renewal Date"
                    type="date"
                    value={formData.warrantyDocument.renewalDate}
                    onChange={(e) =>
                      updateSectionField(
                        'warrantyDocument',
                        'renewalDate',
                        e.target.value
                      )
                    }
                  />
                  <Input
                    label="Expiry Date"
                    type="date"
                    value={formData.warrantyDocument.expiryDate}
                    onChange={(e) =>
                      updateSectionField(
                        'warrantyDocument',
                        'expiryDate',
                        e.target.value
                      )
                    }
                  />
                  <UploadDocumentField
                    label="Upload Document"
                    value={formData.warrantyDocument.uploadDocument}
                    onChange={(val) =>
                      updateSectionField(
                        'warrantyDocument',
                        'uploadDocument',
                        val
                      )
                    }
                    placeholder="e.g., FitnessCard.pdf"
                  />
                </FormSection>
              )}
            </div>
          </Card>

          {/* FORM FOOTER ACTIONS: Go Back | Save As Draft | Submit */}
          <div className="bg-awn-surface border border-awn-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-awn-text-secondary">
              Preserve progress with <strong className="text-awn-text-primary">Save As Draft</strong> or click{' '}
              <strong className="text-awn-text-primary">Submit</strong> to validate and open Non-Compliance Asset Details.
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setFlowStep('list')}
                disabled={submitting}
              >
                Go Back
              </Button>
              <Button
                variant="gold"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveAsDraft}
                loading={submitting}
              >
                Save As Draft
              </Button>
              <Button
                type="submit"
                variant="primary"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                loading={submitting}
              >
                Submit
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ============================================================================
  // STEP 3: NON-COMPLIANCE ASSET DETAILS
  // ============================================================================
  if (flowStep === 'details' && activeAsset) {
    const basic = activeAsset.basicDetails;
    const ident = activeAsset.assetIdentification;
    const fin = activeAsset.financialOwnership;
    const war = activeAsset.warrantyDocument;
    const isRetired = activeAsset.status === 'Retired';
    const isDraft = activeAsset.status === 'Draft';

    return (
      <div className="space-y-6">
        {/* Top Navigation Context */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setFlowStep('list')}
            >
              Back to Non-Compliance Assets
            </Button>
            <span className="text-awn-text-muted text-xs">·</span>
            <button
              type="button"
              onClick={() => onNavigate('/assets/registry')}
              className="text-xs text-awn-text-secondary hover:text-awn-primary cursor-pointer"
            >
              Main Assets Workspace
            </button>
          </div>
          <span className="text-xs font-mono text-awn-text-muted tabular-nums">
            Asset ID: {activeAsset.code}
          </span>
        </div>

        <NonComplianceProgressHeader
          currentStep="details"
          onStepClick={setFlowStep}
          isEditingExisting={false}
        />

        {/* Post-Action Success / Draft Confirmation Banner */}
        {lastSubmissionBanner && (
          <div
            role="status"
            className={`p-4 rounded-lg border flex items-start justify-between gap-4 ${
              lastSubmissionBanner.type === 'submitted'
                ? 'bg-awn-success-soft border-awn-success-border text-awn-text-primary'
                : 'bg-awn-gold-soft border-awn-gold text-awn-text-primary'
            }`}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  lastSubmissionBanner.type === 'submitted'
                    ? 'text-awn-success'
                    : 'text-awn-gold'
                }`}
                aria-hidden="true"
              />
              <div>
                <div className="text-sm font-semibold">
                  {lastSubmissionBanner.title}
                </div>
                <p className="text-xs text-awn-text-secondary mt-0.5">
                  {lastSubmissionBanner.message}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLastSubmissionBanner(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Details Header & Required Actions (Section 16) */}
        <PageHeader
          title="Non-Compliance Asset Details"
          description={`${activeAsset.code} · ${ident.assetName || 'Company Laptop - Dell Latitude 5440'} · Serial: ${ident.serialNumber || 'SN-123456789'}`}
          secondaryActions={
            <>
              {!isRetired && (
                <Button
                  variant="dangerOutline"
                  size="md"
                  leftIcon={<Ban className="w-4 h-4" />}
                  onClick={() => setRetireDialogOpen(true)}
                >
                  Retire / Deactivate Asset
                </Button>
              )}
              <Button
                variant="outline"
                size="md"
                leftIcon={<UserPlus className="w-4 h-4" />}
                onClick={() => handleOpenReassignModal(activeAsset)}
              >
                Reassign To Another Employee
              </Button>
            </>
          }
          primaryAction={
            <Button
              variant="primary"
              size="md"
              leftIcon={<Pencil className="w-4 h-4" />}
              onClick={() => handleEditExistingAsset(activeAsset)}
            >
              Edit Asset
            </Button>
          }
        />

        {/* Enterprise Company & Status Summary Card (Section 12) */}
        <div className="bg-awn-surface border border-awn-border rounded-lg p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-awn-primary-soft border border-awn-primary flex items-center justify-center text-awn-primary shrink-0">
                <Building2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-base font-semibold text-awn-text-primary">
                    {activeAsset.companyName || 'Advanced Tech Co.'}
                  </h2>
                  <StatusBadge
                    label={
                      isRetired
                        ? 'Retired'
                        : isDraft
                        ? 'Draft'
                        : `Status: ${activeAsset.status}`
                    }
                    tone={activeAsset.statusTone}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-awn-text-secondary mt-1.5">
                  <span>
                    Company:{' '}
                    <strong className="text-awn-text-primary">
                      {activeAsset.companyName || 'Advanced Tech Co.'}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    CR:{' '}
                    <strong className="font-mono text-awn-text-primary tabular-nums">
                      {activeAsset.crNumber || 'CR-1040123486'}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Unified ID:{' '}
                    <strong className="font-mono text-awn-text-primary tabular-nums">
                      {activeAsset.unifiedId || 'UNIFIED-7001928345'}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Status:{' '}
                    <strong className="text-awn-text-primary">
                      {activeAsset.status}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-awn-text-muted font-mono tabular-nums md:text-right">
              <div>Last Updated: {activeAsset.updatedAt}</div>
              <div className="mt-0.5">
                Assigned Custodian: {ident.assignedTo || 'Unassigned'}
              </div>
            </div>
          </div>
        </div>

        {/* Details Sections Grid (Sections 13, 14, 15) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* SECTION 13: BASIC INFORMATION */}
          <Card title="Basic Information" className="lg:col-span-2">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Asset Name</dt>
                <dd className="font-semibold text-awn-text-primary mt-1">
                  {ident.assetName || 'Company Laptop - Dell Latitude 5440'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Asset Category</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.assetsCategory || 'Compliance'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Serial Number</dt>
                <dd className="font-mono font-semibold text-awn-text-primary mt-1 tabular-nums">
                  {ident.serialNumber || 'SN-123456789'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Asset Type</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {ident.assetType || 'Laptop'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Purchase Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ident.purchaseDate || '2025-01-15'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Assigned to</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {ident.assignedTo || 'Unassigned'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Assets Type</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.assetsType === 'Vehicle' ? 'Non-Vehicle' : basic.assetsType || 'Non-Vehicle'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Model / Brand</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {ident.modelBrand || 'Dell Latitude 5440'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Condition</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {fin.condition || 'Good'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Warranty Expiry</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ident.warrantyExpiry || '2028-01-14'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* SECTION 14: FINANCIAL & OWNERSHIP */}
          <Card title="Financial & Ownership">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Purchase Value</dt>
                <dd className="font-mono font-semibold text-awn-text-primary mt-1 tabular-nums">
                  {fin.purchaseValueSar || '4,500 SAR'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Useful Life</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {fin.usefulLifeYears || '3 Years'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Current Book Value</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {fin.currentBookValue || '3,200 SAR as of 2025'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Vendor</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {fin.vendorSupplier || 'Jarir Bookstore'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Depreciation Method</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {fin.depreciationMethod || 'Straight Line'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Asset Location</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {fin.assetLocation || 'Riyadh HQ - Floor 3'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* SECTION 15: WARRANTY DOCUMENT */}
          <Card title="Warranty Document">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Document Name</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {war.documentName || 'MOT Test'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Issue Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {war.issueDate || '2025-01-15'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Renewal Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {war.renewalDate || '2027-12-15'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Document Number</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {war.documentNumber || 'WAR-DL5440-2025-091'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Validity Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {war.validityDate || war.expiryDate || '2028-01-14'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Document Copy</dt>
                <dd className="mt-1">
                  <button
                    type="button"
                    onClick={() =>
                      showToast({
                        title: 'Opening Document Copy',
                        description: `Previewing ${war.uploadDocument || 'FitnessCard.pdf'}`,
                        variant: 'info',
                      })
                    }
                    className="inline-flex items-center gap-1.5 font-medium text-awn-primary hover:underline cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{war.uploadDocument || 'FitnessCard.pdf'}</span>
                  </button>
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* Success State Confirmation Modal (Section 11) */}
        <Modal
          isOpen={successModalOpen}
          onClose={() => setSuccessModalOpen(false)}
          title="Asset Added Successfully!"
          size="sm"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccessModalOpen(false);
                  onNavigate('/assets/registry');
                }}
              >
                Go to Assets Workspace
              </Button>
              <Button
                variant="primary"
                onClick={() => setSuccessModalOpen(false)}
              >
                View Asset Details
              </Button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-awn-success-soft border border-awn-success-border flex items-center justify-center text-awn-success shrink-0">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-awn-text-primary leading-relaxed">
                Asset Added Successfully! The asset has been recorded in the system. You can now assign it to an employee, track its status, and manage it from the Assets dashboard.
              </p>
              <div className="p-2.5 rounded-md bg-awn-surface-alt border border-awn-border text-xs font-mono text-awn-text-secondary tabular-nums">
                {activeAsset.code} · {ident.assetName || 'Company Laptop - Dell Latitude 5440'} · Status: {activeAsset.status}
              </div>
            </div>
          </div>
        </Modal>

        {/* Reassign To Another Employee Modal (Section 16) */}
        <Modal
          isOpen={reassignModalOpen}
          onClose={() => setReassignModalOpen(false)}
          title="Reassign To Another Employee"
          description={`Update employee custody for ${activeAsset.code} (${ident.assetName || 'Company Laptop - Dell Latitude 5440'}).`}
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setReassignModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmReassign}
                loading={submitting}
              >
                Confirm Reassignment
              </Button>
            </>
          }
        >
          <form onSubmit={handleConfirmReassign} className="space-y-4">
            <Select
              label="Assigned To"
              required
              options={selectOpts.employees}
              value={selectedReassignEmployee}
              onChange={(e) => {
                const nextEmpName = e.target.value;
                setSelectedReassignEmployee(nextEmpName);
                const matched = selectOpts.employees.find(
                  (emp) => emp.value === nextEmpName
                );
                if (matched?.location) {
                  setReassignLocation(matched.location);
                }
              }}
            />
            <Input
              label="Asset Location"
              value={reassignLocation}
              onChange={(e) => setReassignLocation(e.target.value)}
              placeholder="Riyadh HQ - Floor 3"
            />
          </form>
        </Modal>

        {/* Retire / Deactivate Confirmation Dialog (Section 16) */}
        <ConfirmDialog
          isOpen={retireDialogOpen}
          onClose={() => setRetireDialogOpen(false)}
          onConfirm={handleConfirmRetire}
          title="Retire / Deactivate Asset"
          description="Confirming this action will transition this Non-Compliance Asset to Retired status and synchronize its status with the Main Assets workspace."
          itemSummary={`${activeAsset.code} — ${ident.assetName || 'Company Laptop - Dell Latitude 5440'} (${ident.serialNumber || 'SN-123456789'})`}
          confirmLabel="Confirm Retire / Deactivate"
          loading={submitting}
        >
          <Input
            label="Reason for Retirement / Deactivation"
            placeholder="e.g., End of lifecycle or hardware replacement"
            value={retireReason}
            onChange={(e) => setRetireReason(e.target.value)}
          />
        </ConfirmDialog>
      </div>
    );
  }

  // ============================================================================
  // DEFAULT VIEW: NON-COMPLIANCE ASSETS REGISTRY & ENTRY LIST
  // ============================================================================
  return (
    <div className="space-y-6">
      <PageHeader
        title="Non-Compliance Assets"
        description="Track and manage corporate IT hardware, devices, financial ownership records, and warranty documentation."
        secondaryActions={
          <Button
            variant="outline"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => onNavigate('/assets/registry')}
          >
            Back to Assets
          </Button>
        }
        primaryAction={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleStartNewNonComplianceAsset}
          >
            Add New Non-Compliance
          </Button>
        }
      />

      {/* Non-Compliance Assets Table */}
      <div className="bg-awn-surface border border-awn-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-awn-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by code, asset name, serial, employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              leftIcon={<Search className="w-4 h-4" />}
              aria-label="Search non-compliance assets"
            />
          </div>

          <div
            role="group"
            aria-label="Filter non-compliance assets by status"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-md bg-awn-surface-alt border border-awn-border"
          >
            {['ALL', 'Active', 'Draft', 'Retired'].map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                    active
                      ? 'bg-awn-surface text-awn-primary font-semibold border border-awn-border'
                      : 'text-awn-text-secondary hover:text-awn-text-primary'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              );
            })}
          </div>
        </div>

        {loadingList ? (
          <TableSkeleton rows={4} columns={6} />
        ) : nonComplianceList.length === 0 ? (
          <EmptyState
            title="No Non-Compliance Assets Found"
            description="Create a new Non-Compliance asset to record identification, financial ownership, and warranty documents."
            primaryActionLabel="Add New Non-Compliance"
            onPrimaryAction={handleStartNewNonComplianceAsset}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-awn-surface-alt border-b border-awn-border text-xs font-semibold text-awn-text-secondary">
                  <th className="py-3 px-4 whitespace-nowrap">Asset ID</th>
                  <th className="py-3 px-4">Asset Name & Serial</th>
                  <th className="py-3 px-4 whitespace-nowrap">Category & Type</th>
                  <th className="py-3 px-4 whitespace-nowrap">Assigned To</th>
                  <th className="py-3 px-4 whitespace-nowrap">Purchase Value</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-awn-border text-sm">
                {nonComplianceList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-awn-surface-alt transition-colors"
                  >
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenAssetDetails(item)}
                        className="font-mono text-xs font-semibold text-awn-primary hover:underline tabular-nums cursor-pointer"
                      >
                        {item.code}
                      </button>
                      <div className="text-[11px] text-awn-text-muted mt-0.5">
                        {item.companyName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <button
                        type="button"
                        onClick={() => handleOpenAssetDetails(item)}
                        className="font-medium text-awn-text-primary hover:text-awn-primary text-left cursor-pointer"
                      >
                        {item.assetIdentification?.assetName ||
                          'Company Laptop - Dell Latitude 5440'}
                      </button>
                      <div className="text-xs text-awn-text-muted mt-0.5 font-mono tabular-nums">
                        {item.assetIdentification?.serialNumber || 'SN-123456789'} ·{' '}
                        {item.assetIdentification?.modelBrand || 'Dell Latitude 5440'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="text-xs font-medium text-awn-text-primary">
                        {item.basicDetails?.assetsCategory || 'Compliance'}
                      </div>
                      <div className="text-xs text-awn-text-secondary mt-0.5">
                        {item.assetIdentification?.assetType || 'Laptop'} ·{' '}
                        {item.basicDetails?.assetsType || 'Non-Vehicle'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="text-xs font-medium text-awn-text-primary">
                        {item.assetIdentification?.assignedTo || 'Unassigned'}
                      </div>
                      <div className="text-xs text-awn-text-muted mt-0.5">
                        {item.financialOwnership?.assetLocation ||
                          'Riyadh HQ - Floor 3'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap font-mono text-xs text-awn-text-primary tabular-nums">
                      {item.financialOwnership?.purchaseValueSar || '4,500 SAR'}
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <StatusBadge label={item.status} tone={item.statusTone} />
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenAssetDetails(item)}
                        >
                          Asset Details
                        </Button>
                        <Button
                          variant={item.status === 'Draft' ? 'gold' : 'outline'}
                          size="sm"
                          leftIcon={<Pencil className="w-3.5 h-3.5" />}
                          onClick={() => handleEditExistingAsset(item)}
                        >
                          {item.status === 'Draft' ? 'Continue Draft' : 'Edit'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
