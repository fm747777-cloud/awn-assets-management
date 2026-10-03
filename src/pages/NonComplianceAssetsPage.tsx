import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
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
import { useLanguage } from '../hooks/useLanguage.tsx';
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
  uploadButtonLabel?: string;
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
  uploadButtonLabel = 'Upload Document',
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
          <span>{uploadButtonLabel}</span>
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
  const { t } = useLanguage();

  const steps: Array<{
    id: NonComplianceFlowStep;
    stepNum: string;
    label: string;
    subtitle: string;
  }> = [
    {
      id: 'add-form',
      stepNum: '01',
      label: isEditingExisting
        ? t('nonComplianceAssets.step1Edit')
        : t('nonComplianceAssets.step1'),
      subtitle: t('nonComplianceAssets.step1Subtitle'),
    },
    {
      id: 'choose-documents',
      stepNum: '02',
      label: t('nonComplianceAssets.step2'),
      subtitle: t('nonComplianceAssets.step2Subtitle'),
    },
    {
      id: 'details',
      stepNum: '03',
      label: t('nonComplianceAssets.step3'),
      subtitle: t('nonComplianceAssets.step3Subtitle'),
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
              className={`text-left rtl:text-right p-3 rounded-md border transition-colors flex items-center gap-3 ${
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
  const { t, isRtl, formatNumber } = useLanguage();
  const docOptions = assetModuleService.getNonComplianceDocumentOptions();
  const selectOpts = assetModuleService.getNonComplianceSelectOptions();

  // Document localization helpers
  const getNonComplianceDocTitle = useCallback(
    (id: NonComplianceDocumentId | string) => {
      switch (id) {
        case 'Financial & Ownership Details':
          return t('nonComplianceAssets.docFinancial');
        case 'Warranty Document':
          return t('nonComplianceAssets.docWarranty');
        case 'Proof of Ownership':
          return t('nonComplianceAssets.docProof');
        case 'Driving License':
          return t('nonComplianceAssets.docLicense');
        default:
          return id;
      }
    },
    [t]
  );

  const getNonComplianceDocDesc = useCallback(
    (id: NonComplianceDocumentId | string, fallback: string) => {
      switch (id) {
        case 'Financial & Ownership Details':
          return t('nonComplianceAssets.docFinancialDesc');
        case 'Warranty Document':
          return t('nonComplianceAssets.docWarrantyDesc');
        case 'Proof of Ownership':
          return t('nonComplianceAssets.docProofDesc');
        case 'Driving License':
          return t('nonComplianceAssets.docLicenseDesc');
        default:
          return fallback;
      }
    },
    [t]
  );

  // User-facing value translation helpers (display only, preserving stored values)
  const getConditionLabel = useCallback(
    (condition: string) => {
      if (!isRtl) return condition;
      switch (condition) {
        case 'New':
          return t('nonComplianceAssets.optNew');
        case 'Good':
          return t('nonComplianceAssets.optGood');
        case 'Needs Repair':
          return t('nonComplianceAssets.optNeedsRepair');
        case 'Retired':
          return t('nonComplianceAssets.optRetired');
        default:
          return condition;
      }
    },
    [isRtl, t]
  );

  const getDepreciationLabel = useCallback(
    (method: string) => {
      if (!isRtl) return method;
      switch (method) {
        case 'Straight Line':
          return t('nonComplianceAssets.optStraightLine');
        case 'Declining Balance':
          return t('nonComplianceAssets.optDecliningBalance');
        default:
          return method;
      }
    },
    [isRtl, t]
  );

  const getOwnershipTypeLabel = useCallback(
    (type: string) => {
      if (!isRtl) return type;
      switch (type) {
        case 'Owned':
          return t('nonComplianceAssets.optOwned');
        case 'Leased':
          return t('nonComplianceAssets.optLeased');
        case 'Rented':
          return t('nonComplianceAssets.optRented');
        default:
          return type;
      }
    },
    [isRtl, t]
  );

  const getAssetTypeOptionLabel = useCallback(
    (type: string) => {
      if (!isRtl) return type;
      switch (type) {
        case 'Vehicle':
          return t('nonComplianceAssets.optVehicle');
        case 'Non-Vehicle':
          return t('nonComplianceAssets.optNonVehicle');
        case 'Laptop':
          return t('nonComplianceAssets.optLaptop');
        case 'Mobile Device':
          return t('nonComplianceAssets.optMobileDevice');
        case 'Office Equipment':
          return t('nonComplianceAssets.optOfficeEquipment');
        default:
          return type;
      }
    },
    [isRtl, t]
  );

  const getFilterLabel = useCallback(
    (st: string) => {
      switch (st) {
        case 'ALL':
          return t('nonComplianceAssets.filterAll');
        case 'Active':
          return t('nonComplianceAssets.filterActive');
        case 'Draft':
          return t('nonComplianceAssets.filterDraft');
        case 'Retired':
          return t('nonComplianceAssets.filterRetired');
        default:
          return st;
      }
    },
    [t]
  );

  // Localized select options (display only, preserving stored values)
  const localizedSelectOpts = useMemo(() => {
    if (!isRtl) return selectOpts;
    return {
      ...selectOpts,
      languages: selectOpts.languages.map((opt) => ({
        ...opt,
        label:
          opt.value === 'English'
            ? 'الإنجليزية'
            : opt.value === 'Arabic (العربية)'
            ? 'العربية'
            : 'ثنائي اللغة (EN / AR)',
      })),
      assetCategories: selectOpts.assetCategories.map((opt) => ({
        ...opt,
        label:
          opt.value === 'Compliance'
            ? 'امتثال'
            : opt.value === 'Devices'
            ? 'أجهزة'
            : opt.value === 'IT & Office Equipment'
            ? 'أجهزة ومعدات مكتبية'
            : opt.value === 'Licenses'
            ? 'تراخيص'
            : opt.value === 'Equipment'
            ? 'معدات'
            : opt.label,
      })),
      complianceOptions: selectOpts.complianceOptions.map((opt) => ({
        ...opt,
        label:
          opt.value === 'Non-Compliance'
            ? 'غير متوافق'
            : opt.value === 'Standard Corporate Custody'
            ? 'عهدة مؤسسية قياسية'
            : opt.value === 'Compliance'
            ? 'امتثال'
            : opt.label,
      })),
      assetsTypes: selectOpts.assetsTypes.map((opt) => ({
        ...opt,
        label: getAssetTypeOptionLabel(opt.value),
      })),
      ownershipAssetTypes: selectOpts.ownershipAssetTypes.map((opt) => ({
        ...opt,
        label: getOwnershipTypeLabel(opt.value),
      })),
      conditions: selectOpts.conditions.map((opt) => ({
        ...opt,
        label: getConditionLabel(opt.value),
      })),
      depreciationMethods: selectOpts.depreciationMethods.map((opt) => ({
        ...opt,
        label: getDepreciationLabel(opt.value),
      })),
    };
  }, [
    isRtl,
    selectOpts,
    getAssetTypeOptionLabel,
    getOwnershipTypeLabel,
    getConditionLabel,
    getDepreciationLabel,
  ]);

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
      title: isRtl ? 'تمت إعادة ضبط المستندات' : 'Documents Reset',
      description: isRtl
        ? 'تمت إعادة ضبط المستندات إلى التفاصيل المالية والملكية ووثيقة الضمان.'
        : 'Selected Documents reset to Financial & Ownership Details and Warranty Document.',
      variant: 'info',
    });
  };

  const handleChooseDocumentsSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedDocuments.length === 0) {
      showToast({
        title: isRtl ? 'اختر مستنداً واحداً على الأقل' : 'Select at least one document',
        description: t('nonComplianceAssets.selectAtLeastOneDoc'),
        variant: 'warning',
      });
      return;
    }
    setFlowStep('add-form');
    showToast({
      title: isRtl ? 'تم تحديث المستندات' : 'Documents Updated',
      description: isRtl
        ? `أقسام المستندات النشطة في النموذج: ${formatNumber(selectedDocuments.length)}`
        : `${selectedDocuments.length} document section(s) active in the form.`,
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
      title: isRtl ? 'تمت تعبئة البيانات' : 'Demo values populated',
      description: isRtl
        ? 'تمت تعبئة الحقول بالقيم التجريبية المحددة للتحقق.'
        : 'Populated with exact supplied demo values (Company Laptop - Dell Latitude 5440, SN-123456789, Jarir Bookstore, MOT Test, FitnessCard.pdf).',
      variant: 'info',
    });
  };

  const validateNonComplianceForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Basic Details required fields
    if (!formData.basicDetails.assetsType.trim()) {
      errors['basicDetails.assetsType'] = t('nonComplianceAssets.assetsTypeRequired');
    }

    // Asset Identification required fields
    if (!formData.assetIdentification.assetName.trim()) {
      errors['assetIdentification.assetName'] = t('nonComplianceAssets.assetNameRequired');
    }
    if (!formData.assetIdentification.serialNumber.trim()) {
      errors['assetIdentification.serialNumber'] = t('nonComplianceAssets.serialRequired');
    }

    // Financial & Ownership Details required fields (when selected)
    if (selectedDocuments.includes('Financial & Ownership Details')) {
      if (!formData.financialOwnership.purchaseValueSar.trim()) {
        errors['financialOwnership.purchaseValueSar'] =
          t('nonComplianceAssets.purchaseValueRequired');
      }
      if (!formData.financialOwnership.condition.trim()) {
        errors['financialOwnership.condition'] = t('nonComplianceAssets.conditionRequired');
      }
      if (!formData.financialOwnership.usefulLifeYears.trim()) {
        errors['financialOwnership.usefulLifeYears'] =
          t('nonComplianceAssets.usefulLifeRequired');
      }
    }

    // Warranty Document required fields (when selected)
    if (selectedDocuments.includes('Warranty Document')) {
      if (!formData.warrantyDocument.documentNumber.trim()) {
        errors['warrantyDocument.documentNumber'] = t('nonComplianceAssets.docNumberRequired');
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
        title: isRtl
          ? `تم الحفظ كمسودة (${saved.code})`
          : `Saved As Draft (${saved.code})`,
        message: isRtl
          ? `تم حفظ المسودة ${saved.code} في النظام. يمكنك مراجعة تفاصيلها أدناه أو النقر على "تعديل بيانات الأصل" في أي وقت للإكمال والتقديم.`
          : `Draft ${saved.code} has been preserved in mock service state. You can inspect its current details below or click "Edit Asset" at any time to complete and submit.`,
      });
      await loadNonComplianceList();
      showToast({
        title: isRtl
          ? `تم الحفظ كمسودة (${saved.code})`
          : `Saved As Draft (${saved.code})`,
        description: isRtl
          ? 'تم حفظ بيانات الأصل غير المتوافق كمسودة.'
          : 'Entered Non-Compliance asset values have been preserved as a draft.',
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
        title: isRtl ? 'حقول إلزامية مطلوبة' : 'Required fields missing',
        description: t('nonComplianceAssets.missingRequiredFields'),
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

      setActiveAsset(saved);
      setEditingAssetId(saved.id);
      setLastSubmissionBanner({
        type: 'submitted',
        title: t('nonComplianceAssets.assetAddedSuccess'),
        message: t('nonComplianceAssets.assetAddedDesc'),
      });
      setSuccessModalOpen(true);
      await loadNonComplianceList();
      showToast({
        title: t('nonComplianceAssets.assetAddedSuccess'),
        description: t('nonComplianceAssets.assetAddedDesc'),
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

  const handleConfirmRetire = async () => {
    if (!activeAsset) return;
    setSubmitting(true);
    try {
      const updated = await assetModuleService.retireNonComplianceAsset(activeAsset.id, {
        reason: retireReason,
      });
      setActiveAsset(updated);
      setRetireDialogOpen(false);
      setRetireReason('');
      await loadNonComplianceList();
      showToast({
        title: isRtl
          ? `تم استبعاد الأصل ${updated.code}`
          : `Asset ${updated.code} Retired`,
        description: isRtl
          ? 'تم تحديث حالة الأصل إلى متقاعد/مستبعد ومزامنة حالته مع سجل الأصول.'
          : 'The asset has been retired and synchronized with the workspace.',
        variant: 'info',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReassignModal = () => {
    if (!activeAsset) return;
    setSelectedReassignEmployee(
      activeAsset.assetIdentification?.assignedTo || 'Sarah Al-Otaibi'
    );
    setReassignLocation(
      activeAsset.financialOwnership?.assetLocation || 'Riyadh HQ - Floor 4'
    );
    setReassignModalOpen(true);
  };

  const handleConfirmReassign = async () => {
    if (!activeAsset) return;
    setSubmitting(true);
    try {
      const updated = await assetModuleService.reassignNonComplianceAsset(
        activeAsset.id,
        {
          assignedTo: selectedReassignEmployee,
          location: reassignLocation,
        }
      );
      setActiveAsset(updated);
      setReassignModalOpen(false);
      await loadNonComplianceList();
      showToast({
        title: isRtl ? 'تم نقل العهدة بنجاح' : 'Asset Custody Reassigned',
        description: isRtl
          ? `تم إسناد العهدة إلى ${selectedReassignEmployee} في الموقع (${reassignLocation}).`
          : `Assigned custody of ${updated.code} to ${selectedReassignEmployee} at ${reassignLocation}.`,
        variant: 'success',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter available documents by search in Step 2
  const filteredAvailableDocOptions = useMemo(() => {
    const q = documentSearchQuery.trim().toLowerCase();
    if (!q) return docOptions;
    return docOptions.filter(
      (d) =>
        d.label.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        getNonComplianceDocTitle(d.id).toLowerCase().includes(q)
    );
  }, [docOptions, documentSearchQuery, getNonComplianceDocTitle]);

  // ============================================================================
  // STEP 2: CHOOSE DOCUMENTS
  // ============================================================================
  if (flowStep === 'choose-documents') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={
              isRtl ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )
            }
            onClick={() => setFlowStep('add-form')}
          >
            {t('nonComplianceAssets.goBack')}
          </Button>
          <span className="text-xs text-awn-text-muted">
            {t('nonComplianceAssets.stepNoticeChoose')}
          </span>
        </div>

        <NonComplianceProgressHeader
          currentStep="choose-documents"
          onStepClick={setFlowStep}
          isEditingExisting={Boolean(editingAssetId)}
        />

        <PageHeader
          title={t('nonComplianceAssets.chooseDocsTitle')}
          description={t('nonComplianceAssets.chooseDocsDesc')}
          secondaryActions={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleResetAllDocuments}
            >
              {t('nonComplianceAssets.resetAll')}
            </Button>
          }
        />

        <form onSubmit={handleChooseDocumentsSubmit} className="space-y-6">
          {/* Selected Documents Section */}
          <Card
            title={t('nonComplianceAssets.selectedDocsTitle')}
            description={t('nonComplianceAssets.selectedDocsDesc')}
          >
            {selectedDocuments.length === 0 ? (
              <p className="text-xs text-awn-text-muted">
                {t('nonComplianceAssets.noneSelected')}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {selectedDocuments.map((docId) => (
                  <div
                    key={docId}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-awn-primary-soft border border-awn-primary text-xs font-semibold text-awn-primary"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{getNonComplianceDocTitle(docId)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Available Documents Section */}
          <Card
            title={t('nonComplianceAssets.availableDocsTitle')}
            description={t('nonComplianceAssets.availableDocsDesc')}
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setFlowStep('add-form')}
                >
                  {t('nonComplianceAssets.goBack')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  rightIcon={
                    isRtl ? (
                      <ArrowLeft className="w-4 h-4" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )
                  }
                >
                  {t('nonComplianceAssets.confirm')}
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="w-full sm:w-80">
                <Input
                  placeholder={t('nonComplianceAssets.searchDocument')}
                  value={documentSearchQuery}
                  onChange={(e) => setDocumentSearchQuery(e.target.value)}
                  onClear={() => setDocumentSearchQuery('')}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredAvailableDocOptions.map((doc) => {
                  const isSelected = selectedDocuments.includes(doc.id);
                  const title = getNonComplianceDocTitle(doc.id);
                  const desc = getNonComplianceDocDesc(doc.id, doc.description);

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
                            {title}
                          </span>
                          {isSelected && (
                            <span className="text-[11px] font-semibold text-awn-primary">
                              {t('nonComplianceAssets.selectedBadge')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-awn-text-secondary mt-1 leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </Card>
        </form>
      </div>
    );
  }

  // ============================================================================
  // STEP 1: ADD / EDIT NON-COMPLIANCE ASSET FORM
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
            leftIcon={
              isRtl ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )
            }
            onClick={() => setFlowStep('list')}
          >
            {t('nonComplianceAssets.backToNonComplianceAssets')}
          </Button>
          <span className="text-xs text-awn-text-muted">
            {t('nonComplianceAssets.stepNoticeForm')}
          </span>
        </div>

        <NonComplianceProgressHeader
          currentStep="add-form"
          onStepClick={setFlowStep}
          isEditingExisting={Boolean(editingAssetId)}
        />

        <PageHeader
          title={
            editingAssetId
              ? t('nonComplianceAssets.step1Edit')
              : t('nonComplianceAssets.addPageTitle')
          }
          description={t('nonComplianceAssets.addPageDesc')}
          secondaryActions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlowStep('choose-documents')}
              >
                {t('nonComplianceAssets.chooseDocumentsCount', {
                  count: formatNumber(selectedDocuments.length),
                })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePopulateDemoValues}
              >
                {t('nonComplianceAssets.fillDemoValues')}
              </Button>
            </div>
          }
        />

        <form onSubmit={handleSubmitNonComplianceAsset} noValidate className="space-y-6">
          <Card>
            <div className="divide-y divide-awn-border">
              {/* SECTION 1: BASIC DETAILS */}
              <FormSection
                stepNumber="01"
                title={t('nonComplianceAssets.basicDetails')}
                description={t('nonComplianceAssets.basicDetailsDesc')}
                columns={2}
              >
                <Select
                  label={t('nonComplianceAssets.language')}
                  required
                  options={localizedSelectOpts.languages}
                  value={formData.basicDetails.language}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'language', e.target.value)
                  }
                />
                <Select
                  label={t('nonComplianceAssets.customer')}
                  required
                  options={localizedSelectOpts.customers}
                  value={formData.basicDetails.customer}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'customer', e.target.value)
                  }
                />
                <Select
                  label={t('nonComplianceAssets.business')}
                  required
                  options={localizedSelectOpts.businesses}
                  value={formData.basicDetails.business}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'business', e.target.value)
                  }
                />
                <Select
                  label={t('nonComplianceAssets.assetsCategory')}
                  required
                  options={localizedSelectOpts.assetCategories}
                  value={formData.basicDetails.assetsCategory}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'assetsCategory', e.target.value)
                  }
                />
                <Select
                  label={t('nonComplianceAssets.compliance')}
                  required
                  options={localizedSelectOpts.complianceOptions}
                  value={formData.basicDetails.compliance}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'compliance', e.target.value)
                  }
                />
                <Select
                  label={t('nonComplianceAssets.assetsType')}
                  required
                  options={localizedSelectOpts.assetsTypes}
                  value={formData.basicDetails.assetsType}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'assetsType', e.target.value)
                  }
                  error={formErrors['basicDetails.assetsType']}
                />
              </FormSection>

              {/* SECTION 2: ASSET IDENTIFICATION */}
              <FormSection
                stepNumber="02"
                title={t('nonComplianceAssets.assetIdentification')}
                description={t('nonComplianceAssets.assetIdentificationDesc')}
                columns={2}
              >
                <Select
                  label={t('nonComplianceAssets.language')}
                  required
                  options={localizedSelectOpts.languages}
                  value={formData.assetIdentification.language}
                  onChange={(e) =>
                    updateSectionField('assetIdentification', 'language', e.target.value)
                  }
                />
                <Input
                  label={t('nonComplianceAssets.assetName')}
                  required
                  placeholder="e.g., Company Laptop - Dell Latitude 5440"
                  value={formData.assetIdentification.assetName}
                  onChange={(e) =>
                    updateSectionField('assetIdentification', 'assetName', e.target.value)
                  }
                  error={formErrors['assetIdentification.assetName']}
                />
                <Input
                  label={t('nonComplianceAssets.serialNumber')}
                  required
                  placeholder="e.g., SN-123456789"
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
                  label={t('nonComplianceAssets.modelBrand')}
                  placeholder="e.g., Dell Latitude 5440"
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
                  label={t('nonComplianceAssets.assetType')}
                  required
                  options={localizedSelectOpts.ownershipAssetTypes}
                  value={formData.assetIdentification.assetType}
                  onChange={(e) =>
                    updateSectionField('assetIdentification', 'assetType', e.target.value)
                  }
                />
                <Input
                  label={t('nonComplianceAssets.purchaseDate')}
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
                  label={t('nonComplianceAssets.warrantyExpiry')}
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
                  label={t('nonComplianceAssets.assignedTo')}
                  required
                  options={localizedSelectOpts.employees}
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

              {/* SECTION 3: DOCUMENTS INFORMATION */}
              <FormSection
                stepNumber="03"
                title={t('nonComplianceAssets.documentsInfo')}
                description={t('nonComplianceAssets.documentsInfoDesc')}
                columns={2}
              >
                <Select
                  label={t('nonComplianceAssets.chooseTemplate')}
                  options={localizedSelectOpts.templates}
                  value={formData.documentsInfo.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  description={t('complianceAssets.chooseTemplateDesc')}
                />
                <div className="flex flex-col justify-center gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-awn-text-primary">
                      {t('complianceAssets.selectedDocSections')}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFlowStep('choose-documents')}
                    >
                      {t('nonComplianceAssets.chooseDocsTitle')} →
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {docOptions.map((doc) => {
                      const active = selectedDocuments.includes(doc.id);
                      const title = getNonComplianceDocTitle(doc.id);
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => toggleDocumentSelection(doc.id)}
                          aria-pressed={active}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                            active
                              ? 'bg-awn-primary-soft text-awn-primary border-awn-primary font-semibold'
                              : 'bg-awn-surface-alt text-awn-text-secondary border-awn-border hover:text-awn-text-primary'
                          }`}
                        >
                          {active && <Check className="w-3 h-3 shrink-0" />}
                          <span>{title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </FormSection>

              {/* SECTION 4: FINANCIAL & OWNERSHIP DETAILS (When Selected) */}
              {showFinancialSection && (
                <FormSection
                  stepNumber="04"
                  title={t('nonComplianceAssets.financialOwnership')}
                  description={t('nonComplianceAssets.financialOwnershipDesc')}
                  columns={2}
                >
                  <Input
                    label={t('nonComplianceAssets.purchaseValueSar')}
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
                    label={t('nonComplianceAssets.vendorSupplier')}
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
                    label={t('nonComplianceAssets.assetLocation')}
                    placeholder="e.g., Riyadh HQ - Floor 3"
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
                    label={t('nonComplianceAssets.condition')}
                    required
                    options={localizedSelectOpts.conditions}
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
                    label={t('nonComplianceAssets.usefulLifeYears')}
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
                    label={t('nonComplianceAssets.depreciationMethod')}
                    options={localizedSelectOpts.depreciationMethods}
                    value={formData.financialOwnership.depreciationMethod}
                    onChange={(e) =>
                      updateSectionField(
                        'financialOwnership',
                        'depreciationMethod',
                        e.target.value
                      )
                    }
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label={t('nonComplianceAssets.currentBookValue')}
                      placeholder="e.g., 3,200 SAR as of 2025"
                      value={formData.financialOwnership.currentBookValue}
                      onChange={(e) =>
                        updateSectionField(
                          'financialOwnership',
                          'currentBookValue',
                          e.target.value
                        )
                      }
                    />
                  </div>
                </FormSection>
              )}

              {/* SECTION 5: WARRANTY DOCUMENT (When Selected) */}
              {showWarrantySection && (
                <FormSection
                  stepNumber="05"
                  title={t('nonComplianceAssets.warrantyDocument')}
                  description={t('nonComplianceAssets.warrantyDocumentDesc')}
                  columns={2}
                >
                  <Input
                    label={t('nonComplianceAssets.documentName')}
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
                    label={t('nonComplianceAssets.documentNumber')}
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
                    label={t('nonComplianceAssets.issueDate')}
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
                    label={t('nonComplianceAssets.renewalDate')}
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
                    label={t('nonComplianceAssets.expiryDate')}
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
                  <Input
                    label={t('nonComplianceAssets.validityDate')}
                    type="date"
                    value={formData.warrantyDocument.validityDate}
                    onChange={(e) =>
                      updateSectionField(
                        'warrantyDocument',
                        'validityDate',
                        e.target.value
                      )
                    }
                  />
                  <div className="sm:col-span-2">
                    <UploadDocumentField
                      label={t('nonComplianceAssets.uploadDocument')}
                      value={formData.warrantyDocument.uploadDocument}
                      onChange={(val) =>
                        updateSectionField('warrantyDocument', 'uploadDocument', val)
                      }
                      placeholder={isRtl ? 'مثال: FitnessCard.pdf' : 'e.g., FitnessCard.pdf'}
                      uploadButtonLabel={t('nonComplianceAssets.uploadDocument')}
                    />
                  </div>
                </FormSection>
              )}
            </div>
          </Card>

          {/* FORM FOOTER ACTIONS: Save As Draft | Submit */}
          <div className="bg-awn-surface border border-awn-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-awn-text-secondary">
              {t('nonComplianceAssets.formNotice')}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setFlowStep('list')}
                disabled={submitting}
              >
                {t('nonComplianceAssets.cancel')}
              </Button>
              <Button
                variant="gold"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveAsDraft}
                loading={submitting}
              >
                {t('nonComplianceAssets.saveAsDraft')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                loading={submitting}
              >
                {t('nonComplianceAssets.submit')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ============================================================================
  // STEP 3: NON-COMPLIANCE ASSET DETAILS VIEW
  // ============================================================================
  if (flowStep === 'details' && activeAsset) {
    const basic = activeAsset.basicDetails;
    const ident = activeAsset.assetIdentification;
    const fin = activeAsset.financialOwnership;
    const war = activeAsset.warrantyDocument;
    const isRetired = activeAsset.status === 'Retired';
    const isDraft = activeAsset.status === 'Draft';
    const displayStatusLabel =
      activeAsset.status === 'Draft'
        ? t('nonComplianceAssets.optDraft')
        : activeAsset.status === 'Retired'
        ? t('nonComplianceAssets.optRetired')
        : activeAsset.status === 'Assigned'
        ? t('nonComplianceAssets.optAssigned')
        : activeAsset.status === 'Available'
        ? t('nonComplianceAssets.optAvailable')
        : activeAsset.status;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={
                isRtl ? (
                  <ArrowRight className="w-4 h-4" />
                ) : (
                  <ArrowLeft className="w-4 h-4" />
                )
              }
              onClick={() => setFlowStep('list')}
            >
              {t('nonComplianceAssets.backToNonComplianceAssets')}
            </Button>
            <span className="text-awn-text-muted text-xs">·</span>
            <button
              type="button"
              onClick={() => onNavigate('/assets/registry')}
              className="text-xs text-awn-text-secondary hover:text-awn-primary cursor-pointer"
            >
              {t('complianceAssets.mainAssetsWorkspace')}
            </button>
          </div>
          <span className="text-xs font-mono text-awn-text-muted tabular-nums">
            {t('complianceAssets.assetIdLabel')}: {activeAsset.code}
          </span>
        </div>

        <NonComplianceProgressHeader
          currentStep="details"
          onStepClick={setFlowStep}
          isEditingExisting={false}
        />

        {/* Post-Action Confirmation Banner */}
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
              {t('nonComplianceAssets.dismiss')}
            </Button>
          </div>
        )}

        {/* Header with Status and Lifecycle Actions */}
        <PageHeader
          title={t('nonComplianceAssets.assetDetailsTitle')}
          description={`${activeAsset.code} · ${ident.assetName || basic.assetsType} · SN: ${ident.serialNumber || '—'}`}
          secondaryActions={
            <div className="flex items-center gap-2">
              {!isRetired && (
                <Button
                  variant="dangerOutline"
                  size="md"
                  leftIcon={<Ban className="w-4 h-4" />}
                  onClick={() => setRetireDialogOpen(true)}
                >
                  {t('nonComplianceAssets.retireDeactivateAsset')}
                </Button>
              )}
              <Button
                variant="outline"
                size="md"
                leftIcon={<UserPlus className="w-4 h-4" />}
                onClick={handleOpenReassignModal}
              >
                {t('nonComplianceAssets.reassignToEmployee')}
              </Button>
            </div>
          }
          primaryAction={
            <Button
              variant="primary"
              size="md"
              leftIcon={<Pencil className="w-4 h-4" />}
              onClick={() => handleEditExistingAsset(activeAsset)}
            >
              {t('nonComplianceAssets.editAsset')}
            </Button>
          }
        />

        {/* Enterprise Entity & Custody Overview Card */}
        <div className="bg-awn-surface border border-awn-border rounded-lg p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-awn-primary-soft border border-awn-primary flex items-center justify-center text-awn-primary shrink-0">
                <Building2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-base font-semibold text-awn-text-primary">
                    Advanced Tech Co.
                  </h2>
                  <StatusBadge
                    label={
                      isRetired
                        ? 'Retired'
                        : isDraft
                        ? 'Draft'
                        : activeAsset.status
                    }
                    tone={activeAsset.statusTone}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-awn-text-secondary mt-1.5">
                  <span>
                    {t('nonComplianceAssets.crNumber')}:{' '}
                    <strong className="font-mono text-awn-text-primary tabular-nums">
                      CR-1040123486
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    {t('nonComplianceAssets.unifiedId')}:{' '}
                    <strong className="font-mono text-awn-text-primary tabular-nums">
                      UNIFIED-7001928345
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    {t('complianceAssets.assetIdLabel')}:{' '}
                    <strong className="font-mono text-awn-text-primary tabular-nums">
                      {activeAsset.code}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    {t('nonComplianceAssets.status')}:{' '}
                    <strong className="text-awn-text-primary">
                      {displayStatusLabel}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-awn-text-muted font-mono tabular-nums md:text-right rtl:md:text-left">
              <div>
                {t('nonComplianceAssets.lastUpdated')}: {activeAsset.updatedAt}
              </div>
              <div className="mt-0.5">
                {t('nonComplianceAssets.assignedCustodian')}:{' '}
                <strong className="text-awn-text-primary font-sans">
                  {ident.assignedTo || t('nonComplianceAssets.unassigned')}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Structured Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Basic Information */}
          <Card title={t('nonComplianceAssets.basicInformation')}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.assetName')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {ident.assetName || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.serialNumber')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ident.serialNumber || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.modelBrand')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {ident.modelBrand || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.assetType')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {getOwnershipTypeLabel(ident.assetType)}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.purchaseDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ident.purchaseDate || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.warrantyExpiry')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ident.warrantyExpiry || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.assetsCategory')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.assetsCategory || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.assignedTo')}</dt>
                <dd className="font-medium text-awn-primary mt-1">
                  {ident.assignedTo || t('nonComplianceAssets.unassigned')}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Financial & Ownership */}
          <Card title={t('nonComplianceAssets.financialAndOwnership')}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.purchaseValueSar')}</dt>
                <dd className="font-mono font-semibold text-awn-text-primary mt-1 tabular-nums">
                  {fin.purchaseValueSar || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.vendor')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {fin.vendorSupplier || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.assetLocation')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {fin.assetLocation || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.condition')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {getConditionLabel(fin.condition)}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.usefulLife')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {fin.usefulLifeYears || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.depreciationMethod')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {getDepreciationLabel(fin.depreciationMethod)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.currentBookValue')}</dt>
                <dd className="font-mono font-semibold text-awn-success mt-1 tabular-nums">
                  {fin.currentBookValue || '—'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Warranty Document */}
          <Card title={t('nonComplianceAssets.warrantyDocument')} className="lg:col-span-2">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.documentName')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {war.documentName || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.documentNumber')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {war.documentNumber || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.issueDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {war.issueDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.renewalDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {war.renewalDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.expiryDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {war.expiryDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('nonComplianceAssets.documentCopy')}</dt>
                <dd className="font-medium text-awn-primary mt-1">
                  {war.uploadDocument ? (
                    <button
                      type="button"
                      onClick={() =>
                        showToast({
                          title: war.documentName || t('nonComplianceAssets.warrantyDocument'),
                          description: war.uploadDocument,
                          variant: 'info',
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs text-awn-primary hover:underline cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{war.uploadDocument}</span>
                    </button>
                  ) : (
                    <span className="text-awn-text-muted">
                      {t('complianceAssets.notUploaded')}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* Reassign Modal */}
        <Modal
          isOpen={reassignModalOpen}
          onClose={() => setReassignModalOpen(false)}
          title={t('nonComplianceAssets.reassignTitle')}
          size="sm"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setReassignModalOpen(false)}
                disabled={submitting}
              >
                {t('nonComplianceAssets.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmReassign}
                loading={submitting}
              >
                {t('nonComplianceAssets.confirmReassignment')}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-awn-text-secondary leading-relaxed">
              {t('nonComplianceAssets.reassignDesc', {
                code: activeAsset.code,
                name: ident.assetName || basic.assetsType,
              })}
            </p>
            <Select
              label={t('nonComplianceAssets.assignedTo')}
              required
              options={localizedSelectOpts.employees}
              value={selectedReassignEmployee}
              onChange={(e) => setSelectedReassignEmployee(e.target.value)}
            />
            <Input
              label={t('nonComplianceAssets.assetLocation')}
              required
              placeholder="e.g., Jeddah Office - Branch 2"
              value={reassignLocation}
              onChange={(e) => setReassignLocation(e.target.value)}
            />
          </div>
        </Modal>

        {/* Retire Confirmation Dialog */}
        <ConfirmDialog
          isOpen={retireDialogOpen}
          onClose={() => setRetireDialogOpen(false)}
          onConfirm={handleConfirmRetire}
          title={t('nonComplianceAssets.confirmRetireTitle')}
          description={t('nonComplianceAssets.confirmRetireDesc')}
          itemSummary={`${activeAsset.code} — ${ident.assetName || basic.assetsType} (${ident.serialNumber || '—'})`}
          confirmLabel={t('nonComplianceAssets.confirmRetireButton')}
          cancelLabel={t('nonComplianceAssets.cancel')}
          loading={submitting}
        >
          <Input
            label={t('nonComplianceAssets.retireReasonLabel')}
            placeholder={t('nonComplianceAssets.retireReasonPlaceholder')}
            value={retireReason}
            onChange={(e) => setRetireReason(e.target.value)}
          />
        </ConfirmDialog>
      </div>
    );
  }

  // ============================================================================
  // DEFAULT VIEW: LIST TABLE & REGISTRY
  // ============================================================================
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nonComplianceAssets.title')}
        description={t('nonComplianceAssets.description')}
        secondaryActions={
          <Button
            variant="outline"
            size="md"
            leftIcon={
              isRtl ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )
            }
            onClick={() => onNavigate('/assets/registry')}
          >
            {t('nonComplianceAssets.backToAssets')}
          </Button>
        }
        primaryAction={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleStartNewNonComplianceAsset}
          >
            {t('nonComplianceAssets.addNewNonCompliance')}
          </Button>
        }
      />

      {/* Main Table */}
      <div className="bg-awn-surface border border-awn-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-awn-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              placeholder={t('nonComplianceAssets.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              leftIcon={<Search className="w-4 h-4" />}
              aria-label={t('nonComplianceAssets.searchAria')}
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
                  {getFilterLabel(st)}
                </button>
              );
            })}
          </div>
        </div>

        {loadingList ? (
          <TableSkeleton rows={4} columns={7} />
        ) : nonComplianceList.length === 0 ? (
          <EmptyState
            title={t('nonComplianceAssets.noAssetsFound')}
            description={t('nonComplianceAssets.noAssetsDesc')}
            primaryActionLabel={t('nonComplianceAssets.addNewNonCompliance')}
            onPrimaryAction={handleStartNewNonComplianceAsset}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-awn-surface-alt border-b border-awn-border text-xs font-semibold text-awn-text-secondary">
                  <th className="py-3 px-4 whitespace-nowrap">
                    {t('nonComplianceAssets.colAssetId')}
                  </th>
                  <th className="py-3 px-4">
                    {t('nonComplianceAssets.colAssetNameSerial')}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    {t('nonComplianceAssets.colCategoryType')}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    {t('nonComplianceAssets.colAssignedTo')}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    {t('nonComplianceAssets.colPurchaseValue')}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    {t('nonComplianceAssets.colStatus')}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap text-right rtl:text-left">
                    {t('nonComplianceAssets.colActions')}
                  </th>
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
                        {t('complianceAssets.docsLinked', {
                          count: formatNumber(item.selectedDocuments?.length || 0),
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <button
                        type="button"
                        onClick={() => handleOpenAssetDetails(item)}
                        className="font-medium text-awn-text-primary hover:text-awn-primary text-left rtl:text-right cursor-pointer"
                      >
                        {item.assetIdentification?.assetName ||
                          item.basicDetails?.assetsType ||
                          'Non-Compliance Asset'}
                      </button>
                      <div className="text-xs text-awn-text-muted mt-0.5 font-mono tabular-nums">
                        SN: {item.assetIdentification?.serialNumber || '—'} ·{' '}
                        {item.assetIdentification?.modelBrand || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="text-xs font-medium text-awn-text-primary">
                        {item.basicDetails?.assetsCategory || '—'}
                      </div>
                      <div className="text-xs text-awn-text-secondary mt-0.5">
                        {getOwnershipTypeLabel(
                          item.assetIdentification?.assetType || 'Owned'
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="text-xs font-medium text-awn-text-primary">
                        {item.assetIdentification?.assignedTo ||
                          t('nonComplianceAssets.unassigned')}
                      </div>
                      <div className="text-xs text-awn-text-muted mt-0.5">
                        {item.financialOwnership?.assetLocation || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap font-mono text-xs tabular-nums text-awn-text-primary">
                      {item.financialOwnership?.purchaseValueSar || '—'}
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <StatusBadge label={item.status} tone={item.statusTone} />
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap text-right rtl:text-left">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenAssetDetails(item)}
                        >
                          {t('nonComplianceAssets.assetDetails')}
                        </Button>
                        <Button
                          variant={item.status === 'Draft' ? 'gold' : 'outline'}
                          size="sm"
                          leftIcon={<Pencil className="w-3.5 h-3.5" />}
                          onClick={() => handleEditExistingAsset(item)}
                        >
                          {item.status === 'Draft'
                            ? t('nonComplianceAssets.continueDraft')
                            : t('nonComplianceAssets.edit')}
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
