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
  Pencil,
  Plus,
  Save,
  Search,
  Upload,
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
import { DataTable, dataTableFeatures } from '../components/table/DataTable.tsx';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  AssetDocument,
  ComplianceAsset,
  ComplianceAssetFormData,
  ComplianceDocumentId,
  RouterQueryParams,
  ValidationErrors,
} from '../types/index.ts';

export type ComplianceFlowStep =
  | 'list'
  | 'choose-documents'
  | 'add-form'
  | 'details';

const EMPTY_COMPLIANCE_FORM: ComplianceAssetFormData = {
  basicDetails: {
    language: 'Bilingual (EN / AR)',
    customer: 'Advanced Tech Co.',
    business: 'Fleet & Heavy Transport Operations',
    assetsCategory: 'Commercial & Utility Vehicles',
    compliance: 'TGA & Traffic Statutory Compliance',
    assetsType: 'Heavy Duty Flatbed Truck',
  },
  vehicleInfo: {
    language: 'Bilingual (EN / AR)',
    plateNumberEn: '',
    plateNumberAr: '',
    ownerName: '',
    ownerId: '',
    serialNumber: '',
    vinNumber: '',
  },
  driverInfo: {
    language: 'Bilingual (EN / AR)',
    driverId: '',
    driverName: '',
    driverLicenseCopy: '',
    licenseIssueDate: '2025-01-15',
    licenseExpiryDate: '2030-01-14',
    licenseRenewalDate: '2029-12-15',
  },
  documentsInfo: {
    template: 'Custom Document Selection',
  },
  registrationDetails: {
    registrationType: 'Commercial Transport (نقل عام)',
    vehicleCategory: 'Heavy Truck (شاحنة ثقيلة)',
    brand: '',
    color: '',
    registrationIssueDate: '',
    registrationValidityDate: '',
    manufacturingYear: '2026',
    registrationCopy: '',
  },
  fitnessDetails: {
    fitnessName: '',
    fitnessNumber: '',
    fitnessValidityDate: '',
    expiryDate: '',
    renewalDate: '',
    fitnessDocumentCopy: '',
  },
  insuranceInfo: {
    policyName: '',
    insurancePolicyNumber: '',
    insuranceType: 'Comprehensive Commercial Fleet',
    insuranceIssue: '',
    insuranceValidity: '',
    renewalDate: '',
    operationsCardCopy: '',
  },
  operationsCardInfo: {
    cardName: '',
    cardNumber: '',
    issueDate: '',
    expiryDate: '',
    renewalDate: '',
    operationsCardCopy: '',
  },
};

function cloneForm(form: ComplianceAssetFormData): ComplianceAssetFormData {
  return JSON.parse(JSON.stringify(form)) as ComplianceAssetFormData;
}

interface FileCopyFieldProps {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  browseLabel?: string;
}

/**
 * Reusable File Copy Input Control for Document Uploads (Frontend-only)
 */
function FileCopyField({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = 'Select or enter document file reference...',
  browseLabel = 'Browse',
}: FileCopyFieldProps) {
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
          <span>{browseLabel}</span>
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

interface FlowProgressHeaderProps {
  currentStep: ComplianceFlowStep;
  onStepClick?: (step: ComplianceFlowStep) => void;
  isEditingExisting: boolean;
}

/**
 * Step Progress Bar maintaining clear context across:
 * New Asset → Compliance → Choose Documents → Add Compliance Asset → Save as Draft OR Submit → Asset Details
 */
function FlowProgressHeader({
  currentStep,
  onStepClick,
  isEditingExisting,
}: FlowProgressHeaderProps) {
  const { t } = useLanguage();

  const steps: Array<{
    id: ComplianceFlowStep;
    stepNum: string;
    label: string;
    subtitle: string;
  }> = [
    {
      id: 'choose-documents',
      stepNum: '01',
      label: t('complianceAssets.step1'),
      subtitle: t('complianceAssets.step1Subtitle'),
    },
    {
      id: 'add-form',
      stepNum: '02',
      label: isEditingExisting
        ? t('complianceAssets.step2Edit')
        : t('complianceAssets.step2'),
      subtitle: t('complianceAssets.step2Subtitle'),
    },
    {
      id: 'details',
      stepNum: '03',
      label: t('complianceAssets.step3'),
      subtitle: t('complianceAssets.step3Subtitle'),
    },
  ];

  const activeIdx = steps.findIndex((s) => s.id === currentStep);

  return (
    <div
      aria-label="Compliance asset registration progress"
      className="bg-awn-surface border border-awn-border rounded-lg p-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step, idx) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = idx < activeIdx;
          const canNavigateBack = idx < activeIdx && currentStep !== 'details';

          return (
            <button
              key={step.id}
              type="button"
              disabled={!canNavigateBack}
              onClick={() => canNavigateBack && onStepClick?.(step.id)}
              className={`text-left rtl:text-right p-3 rounded-md border transition-colors flex items-center gap-3 ${
                isCurrent
                  ? 'bg-awn-primary-soft border-awn-primary'
                  : isCompleted
                  ? 'bg-awn-surface-alt border-awn-border'
                  : 'bg-awn-surface border-awn-border opacity-70'
              } ${canNavigateBack ? 'cursor-pointer hover:border-awn-primary' : 'cursor-default'}`}
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

export interface ComplianceAssetsPageProps {
  queryParams?: RouterQueryParams;
  onNavigate: (path: string) => void;
}

export default function ComplianceAssetsPage({
  queryParams = {},
  onNavigate,
}: ComplianceAssetsPageProps) {
  const { showToast } = useToast();
  const { t, isRtl, formatNumber } = useLanguage();
  const docOptions = assetModuleService.getComplianceDocumentOptions();
  const selectOpts = assetModuleService.getComplianceSelectOptions();

  // Helper mappings for localized document titles and descriptions
  const getComplianceDocTitle = useCallback(
    (id: ComplianceDocumentId | string) => {
      switch (id) {
        case 'Insurance Information':
          return t('complianceAssets.docInsurance');
        case 'Operations Card Info':
          return t('complianceAssets.docOperationsCard');
        case 'Vehicle Registration Info':
          return t('complianceAssets.docRegistration');
        case 'Vehicle Fitness Info':
          return t('complianceAssets.docFitness');
        case 'Driving License':
          return t('complianceAssets.docDrivingLicense');
        default:
          return id;
      }
    },
    [t]
  );

  const getComplianceDocDesc = useCallback(
    (id: ComplianceDocumentId | string, defaultDesc: string) => {
      switch (id) {
        case 'Insurance Information':
          return t('complianceAssets.docInsuranceDesc');
        case 'Operations Card Info':
          return t('complianceAssets.docOperationsCardDesc');
        case 'Vehicle Registration Info':
          return t('complianceAssets.docRegistrationDesc');
        case 'Vehicle Fitness Info':
          return t('complianceAssets.docFitnessDesc');
        case 'Driving License':
          return t('complianceAssets.docDrivingLicenseDesc');
        default:
          return defaultDesc;
      }
    },
    [t]
  );

  const getMatrixDocName = useCallback(
    (docName: string) => {
      switch (docName) {
        case 'Driver License':
          return t('complianceAssets.docDrivingLicense');
        case 'Registration':
          return t('complianceAssets.docRegistration');
        case 'Fitness Card':
          return t('complianceAssets.docFitness');
        case 'Insurance Policy':
          return t('complianceAssets.docInsurance');
        case 'Operations Card':
          return t('complianceAssets.docOperationsCard');
        default:
          return docName;
      }
    },
    [t]
  );

  const getFilterLabel = useCallback(
    (st: string) => {
      switch (st) {
        case 'ALL':
          return t('complianceAssets.filterAll');
        case 'Active':
          return t('complianceAssets.filterActive');
        case 'Compliance Due':
          return t('complianceAssets.filterComplianceDue');
        case 'Draft':
          return t('complianceAssets.filterDraft');
        case 'Retired':
          return t('complianceAssets.filterRetired');
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
          opt.value === 'Commercial & Utility Vehicles'
            ? 'مركبات تجارية ومرافق'
            : opt.label,
      })),
      complianceTypes: selectOpts.complianceTypes.map((opt) => ({
        ...opt,
        label:
          opt.value === 'TGA & Traffic Statutory Compliance'
            ? 'اشتراطات هيئة النقل والمرور النظامية'
            : opt.label,
      })),
      assetTypes: selectOpts.assetTypes.map((opt) => ({
        ...opt,
        label:
          opt.value === 'Heavy Duty Flatbed Truck'
            ? 'شاحنة نقل مسطحة ثقيلة'
            : opt.label,
      })),
      registrationTypes: selectOpts.registrationTypes.map((opt) => ({
        ...opt,
        label:
          opt.value === 'Commercial Transport (نقل عام)'
            ? 'نقل عام (Commercial Transport)'
            : opt.label,
      })),
      vehicleCategories: selectOpts.vehicleCategories.map((opt) => ({
        ...opt,
        label:
          opt.value === 'Heavy Truck (شاحنة ثقيلة)'
            ? 'شاحنة ثقيلة (Heavy Truck)'
            : opt.label,
      })),
      insuranceTypes: selectOpts.insuranceTypes.map((opt) => ({
        ...opt,
        label:
          opt.value === 'Comprehensive Commercial Fleet'
            ? 'تأمين شامل للأسطول التجاري'
            : opt.label,
      })),
    };
  }, [isRtl, selectOpts]);

  // Flow steps: 'list' | 'choose-documents' | 'add-form' | 'details'
  const [flowStep, setFlowStep] = useState<ComplianceFlowStep>(() =>
    queryParams?.flow === 'new' ? 'choose-documents' : 'list'
  );

  // List State
  const [complianceList, setComplianceList] = useState<ComplianceAsset[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 8;

  const paginatedComplianceList = useMemo(() => {
    return complianceList.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  }, [complianceList, pageIndex, pageSize]);

  // Step 1: Choose Documents State
  // Default Selected Documents includes "Operations Card" ('Operations Card Info') as specified
  const [selectedDocuments, setSelectedDocuments] = useState<ComplianceDocumentId[]>([
    'Operations Card Info',
  ]);

  // Step 2: Form State
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ComplianceAssetFormData>(() =>
    cloneForm(EMPTY_COMPLIANCE_FORM)
  );
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Step 3: Active Asset Details, Success Modal & Confirmation Banner
  const [activeAsset, setActiveAsset] = useState<ComplianceAsset | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lastSubmissionBanner, setLastSubmissionBanner] = useState<{
    type: 'submitted' | 'draft';
    title: string;
    message: string;
  } | null>(null);
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);
  const [retireReason, setRetireReason] = useState('');

  const loadComplianceList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await assetModuleService.getComplianceAssets({
        search: searchQuery,
        status: statusFilter,
      });
      setComplianceList(res.items);
    } finally {
      setLoadingList(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadComplianceList();
  }, [loadComplianceList]);

  // Trigger Choose Documents automatically when navigated with ?flow=new, or open Asset Details when navigated with ?assetId=...
  useEffect(() => {
    if (queryParams?.flow === 'new') {
      setEditingAssetId(null);
      setSelectedDocuments(['Operations Card Info']);
      setFormData(cloneForm(EMPTY_COMPLIANCE_FORM));
      setFormErrors({});
      setLastSubmissionBanner(null);
      setSuccessModalOpen(false);
      setFlowStep('choose-documents');
    } else if (queryParams?.assetId) {
      assetModuleService.getComplianceAssetById(queryParams.assetId).then((found) => {
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
  // HANDLERS FOR CHOOSE DOCUMENTS STEP
  // ============================================================================
  const toggleDocumentSelection = (docId: ComplianceDocumentId) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId) ? prev.filter((item) => item !== docId) : [...prev, docId]
    );
  };

  const handleChooseDocumentsSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedDocuments.length === 0) {
      showToast({
        title: isRtl ? 'اختر مستنداً واحداً على الأقل' : 'Select at least one document',
        description: t('complianceAssets.selectAtLeastOneDoc'),
        variant: 'warning',
      });
      return;
    }
    setFormErrors({});
    setFlowStep('add-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================================================
  // HANDLERS FOR ADD / EDIT COMPLIANCE ASSET FORM
  // ============================================================================
  const updateSectionField = <
    TSection extends keyof ComplianceAssetFormData,
    TField extends keyof ComplianceAssetFormData[TSection] & string,
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
    if (templateName === 'Full Statutory Fleet Compliance (All Documents)') {
      setSelectedDocuments([
        'Insurance Information',
        'Operations Card Info',
        'Vehicle Registration Info',
        'Vehicle Fitness Info',
        'Driving License',
      ]);
    } else if (templateName === 'TGA Operations & Insurance Standard') {
      setSelectedDocuments(['Operations Card Info', 'Insurance Information']);
    } else if (templateName === 'Registration & Periodic Fitness Inspection') {
      setSelectedDocuments(['Vehicle Registration Info', 'Vehicle Fitness Info']);
    }
  };

  const handlePopulateDemoValues = () => {
    setFormData({
      basicDetails: {
        language: 'Bilingual (EN / AR)',
        customer: 'Advanced Tech Co.',
        business: 'Fleet & Heavy Transport Operations',
        assetsCategory: 'Commercial & Utility Vehicles',
        compliance: 'TGA & Traffic Statutory Compliance',
        assetsType: 'Heavy Duty Flatbed Truck',
      },
      vehicleInfo: {
        language: 'Bilingual (EN / AR)',
        plateNumberEn: 'KSA 9240 RYD',
        plateNumberAr: 'ص ق ر ٩٢٤٠',
        ownerName: 'Advanced Tech Co.',
        ownerId: '7001928345',
        serialNumber: 'SN-VOLVO-FH16-2026',
        vinNumber: 'YV2RT40C8PA992401',
      },
      driverInfo: {
        language: 'Bilingual (EN / AR)',
        driverId: '1078234910',
        driverName: 'Yasser Al-Harthi',
        driverLicenseCopy: 'Yasser_AlHarthi_License_2026.pdf',
        licenseIssueDate: '2025-02-01',
        licenseExpiryDate: '2030-01-31',
        licenseRenewalDate: '2030-01-01',
      },
      documentsInfo: {
        template: formData.documentsInfo.template,
      },
      registrationDetails: {
        registrationType: 'Commercial Transport (نقل عام)',
        vehicleCategory: 'Heavy Truck (شاحنة ثقيلة)',
        brand: 'Volvo FH16 750 Heavy Hauler',
        color: 'Pearl White',
        registrationIssueDate: '2026-01-10',
        registrationValidityDate: '2029-01-09',
        manufacturingYear: '2026',
        registrationCopy: 'Istimara_KSA9240RYD.pdf',
      },
      fitnessDetails: {
        fitnessName: 'MVPI Periodic Technical Inspection',
        fitnessNumber: 'MVPI-RYD-2026-92401',
        fitnessValidityDate: '2026-01-15',
        expiryDate: '2027-01-14',
        renewalDate: '2027-01-01',
        fitnessDocumentCopy: 'MVPI_Inspection_92401.pdf',
      },
      insuranceInfo: {
        policyName: 'Tawuniya Commercial Fleet Master Policy',
        insurancePolicyNumber: 'POL-TAW-2026-92401',
        insuranceType: 'Comprehensive Commercial Fleet',
        insuranceIssue: '2026-01-01',
        insuranceValidity: '2026-12-31',
        renewalDate: '2026-12-15',
        operationsCardCopy: 'Tawuniya_Insurance_92401.pdf',
      },
      operationsCardInfo: {
        cardName: 'TGA Heavy Transport Operations Card',
        cardNumber: 'TGA-OP-2026-92401',
        issueDate: '2026-01-12',
        expiryDate: '2027-01-11',
        renewalDate: '2026-12-28',
        operationsCardCopy: 'TGA_Operations_Card_92401.pdf',
      },
    });
    setFormErrors({});
    showToast({
      title: isRtl ? 'تمت تعبئة البيانات' : 'Sample values populated',
      description: isRtl
        ? 'تم ملء حقول النموذج ببيانات تجريبية للمركبة ووثائق الامتثال.'
        : 'Form fields populated with sample vehicle and compliance document data.',
      variant: 'info',
    });
  };

  const validateComplianceForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Basic Details validation
    if (!formData.basicDetails.customer) {
      errors['basicDetails.customer'] = t('complianceAssets.customerRequired');
    }
    if (!formData.basicDetails.business) {
      errors['basicDetails.business'] = t('complianceAssets.businessRequired');
    }
    if (!formData.basicDetails.assetsCategory) {
      errors['basicDetails.assetsCategory'] = t('complianceAssets.categoryRequired');
    }
    if (!formData.basicDetails.assetsType) {
      errors['basicDetails.assetsType'] = t('complianceAssets.assetsTypeRequired');
    }

    // Vehicle Information validation
    if (!formData.vehicleInfo.plateNumberEn.trim()) {
      errors['vehicleInfo.plateNumberEn'] = t('complianceAssets.plateEnRequired');
    }
    if (!formData.vehicleInfo.plateNumberAr.trim()) {
      errors['vehicleInfo.plateNumberAr'] = t('complianceAssets.plateArRequired');
    }
    if (!formData.vehicleInfo.ownerName.trim()) {
      errors['vehicleInfo.ownerName'] = t('complianceAssets.ownerNameRequired');
    }
    if (!formData.vehicleInfo.ownerId.trim()) {
      errors['vehicleInfo.ownerId'] = t('complianceAssets.ownerIdRequired');
    }
    if (!formData.vehicleInfo.serialNumber.trim()) {
      errors['vehicleInfo.serialNumber'] = t('complianceAssets.serialRequired');
    }
    if (!formData.vehicleInfo.vinNumber.trim()) {
      errors['vehicleInfo.vinNumber'] = t('complianceAssets.vinRequired');
    }

    // Selected Document Sections validation
    if (selectedDocuments.includes('Driving License')) {
      if (!formData.driverInfo.driverId.trim()) {
        errors['driverInfo.driverId'] = t('complianceAssets.driverIdRequired');
      }
      if (!formData.driverInfo.driverName.trim()) {
        errors['driverInfo.driverName'] = t('complianceAssets.driverNameRequired');
      }
      if (!formData.driverInfo.driverLicenseCopy.trim()) {
        errors['driverInfo.driverLicenseCopy'] = t('complianceAssets.driverLicenseCopyRequired');
      }
    }

    if (selectedDocuments.includes('Vehicle Registration Info')) {
      if (!formData.registrationDetails.brand.trim()) {
        errors['registrationDetails.brand'] = t('complianceAssets.brandRequired');
      }
      if (!formData.registrationDetails.color.trim()) {
        errors['registrationDetails.color'] = t('complianceAssets.colorRequired');
      }
      if (!formData.registrationDetails.registrationIssueDate) {
        errors['registrationDetails.registrationIssueDate'] = t('complianceAssets.regIssueDateRequired');
      }
      if (!formData.registrationDetails.registrationValidityDate) {
        errors['registrationDetails.registrationValidityDate'] = t('complianceAssets.regValidityDateRequired');
      }
      if (!formData.registrationDetails.registrationCopy.trim()) {
        errors['registrationDetails.registrationCopy'] = t('complianceAssets.regCopyRequired');
      }
    }

    if (selectedDocuments.includes('Vehicle Fitness Info')) {
      if (!formData.fitnessDetails.fitnessName.trim()) {
        errors['fitnessDetails.fitnessName'] = t('complianceAssets.fitnessNameRequired');
      }
      if (!formData.fitnessDetails.fitnessNumber.trim()) {
        errors['fitnessDetails.fitnessNumber'] = t('complianceAssets.fitnessNumberRequired');
      }
      if (!formData.fitnessDetails.expiryDate) {
        errors['fitnessDetails.expiryDate'] = t('complianceAssets.fitnessExpiryRequired');
      }
      if (!formData.fitnessDetails.fitnessDocumentCopy.trim()) {
        errors['fitnessDetails.fitnessDocumentCopy'] = t('complianceAssets.fitnessCopyRequired');
      }
    }

    if (selectedDocuments.includes('Insurance Information')) {
      if (!formData.insuranceInfo.policyName.trim()) {
        errors['insuranceInfo.policyName'] = t('complianceAssets.policyNameRequired');
      }
      if (!formData.insuranceInfo.insurancePolicyNumber.trim()) {
        errors['insuranceInfo.insurancePolicyNumber'] = t('complianceAssets.policyNumberRequired');
      }
      if (!formData.insuranceInfo.insuranceValidity) {
        errors['insuranceInfo.insuranceValidity'] = t('complianceAssets.insuranceValidityRequired');
      }
      if (!formData.insuranceInfo.operationsCardCopy.trim()) {
        errors['insuranceInfo.operationsCardCopy'] = t('complianceAssets.opsCardCopyRequired');
      }
    }

    if (selectedDocuments.includes('Operations Card Info')) {
      if (!formData.operationsCardInfo.cardName.trim()) {
        errors['operationsCardInfo.cardName'] = t('complianceAssets.cardNameRequired');
      }
      if (!formData.operationsCardInfo.cardNumber.trim()) {
        errors['operationsCardInfo.cardNumber'] = t('complianceAssets.cardNumberRequired');
      }
      if (!formData.operationsCardInfo.issueDate) {
        errors['operationsCardInfo.issueDate'] = t('complianceAssets.issueDateRequired');
      }
      if (!formData.operationsCardInfo.expiryDate) {
        errors['operationsCardInfo.expiryDate'] = t('complianceAssets.expiryDateRequired');
      }
      if (!formData.operationsCardInfo.operationsCardCopy.trim()) {
        errors['operationsCardInfo.operationsCardCopy'] = t('complianceAssets.opsCardCopyRequired');
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAsDraft = async () => {
    setSubmitting(true);
    try {
      const saved = await assetModuleService.saveComplianceAsset(
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
          : `Saved as Draft (${saved.code})`,
        message: isRtl
          ? `تم حفظ المسودة ${saved.code} في النظام. يمكنك مراجعة تفاصيلها أدناه أو النقر على "تعديل بيانات الأصل" لإكمال البيانات وتقديمها.`
          : `Draft ${saved.code} has been preserved in the mock service state. You can review its current details below or click "Edit Asset" at any time to complete and submit.`,
      });
      await loadComplianceList();
      showToast({
        title: isRtl
          ? `تم الحفظ كمسودة (${saved.code})`
          : `Saved as Draft (${saved.code})`,
        description: isRtl
          ? 'تم حفظ بيانات أصل الامتثال المدخلة كمسودة.'
          : 'Entered compliance asset data has been preserved as a draft.',
        variant: 'info',
      });
      setFlowStep('details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComplianceAsset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateComplianceForm()) {
      showToast({
        title: isRtl ? 'حقول إلزامية مطلوبة' : 'Required fields missing',
        description: t('complianceAssets.missingRequiredFields'),
        variant: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      const saved = await assetModuleService.saveComplianceAsset(
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
        title: t('complianceAssets.assetAddedSuccess'),
        message: t('complianceAssets.assetAddedDesc'),
      });
      setSuccessModalOpen(true);
      await loadComplianceList();
      showToast({
        title: t('complianceAssets.assetAddedSuccess'),
        description: t('complianceAssets.assetAddedDesc'),
        variant: 'success',
      });
      setFlowStep('details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNewComplianceAsset = () => {
    setEditingAssetId(null);
    setSelectedDocuments(['Operations Card Info']);
    setFormData(cloneForm(EMPTY_COMPLIANCE_FORM));
    setFormErrors({});
    setLastSubmissionBanner(null);
    setSuccessModalOpen(false);
    setFlowStep('choose-documents');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAssetDetails = (asset: ComplianceAsset) => {
    setActiveAsset(asset);
    setEditingAssetId(asset.id);
    setLastSubmissionBanner(null);
    setSuccessModalOpen(false);
    setFlowStep('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditExistingAsset = (asset: ComplianceAsset) => {
    setActiveAsset(asset);
    setEditingAssetId(asset.id);
    setSelectedDocuments(
      Array.isArray(asset.selectedDocuments) && asset.selectedDocuments.length > 0
        ? asset.selectedDocuments
        : ['Operations Card Info']
    );
    setFormData({
      basicDetails: {
        ...EMPTY_COMPLIANCE_FORM.basicDetails,
        ...(asset.basicDetails || {}),
      },
      vehicleInfo: {
        ...EMPTY_COMPLIANCE_FORM.vehicleInfo,
        ...(asset.vehicleInfo || {}),
      },
      driverInfo: {
        ...EMPTY_COMPLIANCE_FORM.driverInfo,
        ...(asset.driverInfo || {}),
      },
      documentsInfo: {
        ...EMPTY_COMPLIANCE_FORM.documentsInfo,
        ...(asset.documentsInfo || {}),
      },
      registrationDetails: {
        ...EMPTY_COMPLIANCE_FORM.registrationDetails,
        ...(asset.registrationDetails || {}),
      },
      fitnessDetails: {
        ...EMPTY_COMPLIANCE_FORM.fitnessDetails,
        ...(asset.fitnessDetails || {}),
      },
      insuranceInfo: {
        ...EMPTY_COMPLIANCE_FORM.insuranceInfo,
        ...(asset.insuranceInfo || {}),
      },
      operationsCardInfo: {
        ...EMPTY_COMPLIANCE_FORM.operationsCardInfo,
        ...(asset.operationsCardInfo || {}),
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
      const updated = await assetModuleService.retireComplianceAsset(activeAsset.id, {
        reason: retireReason,
      });
      setActiveAsset(updated);
      setRetireDialogOpen(false);
      setRetireReason('');
      await loadComplianceList();
      showToast({
        title: isRtl
          ? `تم استبعاد الأصل ${updated.code}`
          : `Asset ${updated.code} Retired`,
        description: isRtl
          ? 'تم تعطيل أصل الامتثال وتحديده كأصل متقاعد/مستبعد.'
          : 'The compliance asset has been deactivated and marked as Retired.',
        variant: 'info',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const complianceColumns = useMemo<ColumnDef<typeof dataTableFeatures, ComplianceAsset>[]>(
    () => [
      {
        id: 'code',
        accessorKey: 'code',
        header: () => t('complianceAssets.colAssetId'),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => handleOpenAssetDetails(row.original)}
            className="font-mono text-xs font-semibold text-awn-primary hover:underline tabular-nums cursor-pointer"
          >
            {row.original.code}
          </button>
        ),
      },
      {
        id: 'vehicleInfo',
        header: () => t('complianceAssets.colVehicleAssetPlate'),
        cell: ({ row }) => {
          const item = row.original;
          const brand = item.registrationDetails?.brand || item.basicDetails?.assetsType || '—';
          const plateEn = item.vehicleInfo?.plateNumberEn || t('complianceAssets.noPlate');
          const plateAr = item.vehicleInfo?.plateNumberAr;
          return (
            <div className="space-y-0.5">
              <div className="font-medium text-awn-text-primary text-xs">{brand}</div>
              <div className="font-mono text-[11px] text-awn-text-muted flex items-center gap-1.5 tabular-nums">
                <span>{plateEn}</span>
                {plateAr && (
                  <>
                    <span>·</span>
                    <span className="font-sans">{plateAr}</span>
                  </>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'customerBusiness',
        header: () => t('complianceAssets.colCustomerBusiness'),
        cell: ({ row }) => {
          const item = row.original;
          const customer = item.basicDetails?.customer || '—';
          const business = item.basicDetails?.business;
          return (
            <div className="space-y-0.5">
              <div className="text-xs text-awn-text-primary truncate max-w-[180px]">{customer}</div>
              {business && (
                <div className="text-[11px] text-awn-text-muted truncate max-w-[180px]">{business}</div>
              )}
            </div>
          );
        },
      },
      {
        id: 'driver',
        header: () => t('complianceAssets.colAssignedDriver'),
        cell: ({ row }) => {
          const item = row.original;
          const driverName = item.driverInfo?.driverName || t('complianceAssets.unassigned');
          const driverId = item.driverInfo?.driverId;
          return (
            <div className="space-y-0.5">
              <div className="text-xs text-awn-text-primary">{driverName}</div>
              {driverId && (
                <div className="font-mono text-[11px] text-awn-text-muted tabular-nums">ID: {driverId}</div>
              )}
            </div>
          );
        },
      },
      {
        id: 'documents',
        header: () => t('complianceAssets.documents'),
        cell: ({ row }) => {
          const docs = row.original.selectedDocuments || [];
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-awn-text-secondary bg-awn-surface-alt border border-awn-border px-2 py-0.5 rounded">
              <FileCheck2 className="w-3.5 h-3.5 text-awn-primary" />
              <span>{t('complianceAssets.docsLinked', { count: docs.length })}</span>
            </span>
          );
        },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: () => t('complianceAssets.colStatus'),
        cell: ({ row }) => {
          const item = row.original;
          const isDraft = item.status === 'Draft';
          const isRetired = item.status === 'Retired';
          const displayLabel = isRtl
            ? isRetired
              ? t('complianceAssets.filterRetired')
              : isDraft
              ? t('complianceAssets.filterDraft')
              : t('complianceAssets.filterActive')
            : item.status;
          return <StatusBadge label={displayLabel} tone={item.statusTone} />;
        },
      },
      {
        id: 'actions',
        header: () => (
          <span className="block text-right rtl:text-left">
            {t('complianceAssets.colActions')}
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => handleOpenAssetDetails(item)}
                title={t('complianceAssets.assetDetails')}
                aria-label={t('complianceAssets.assetDetails')}
                className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-primary-soft transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleEditExistingAsset(item)}
                title={item.status === 'Draft' ? t('complianceAssets.continueDraft') : t('complianceAssets.edit')}
                aria-label={item.status === 'Draft' ? t('complianceAssets.continueDraft') : t('complianceAssets.edit')}
                className="p-1.5 rounded text-awn-text-secondary hover:text-awn-primary hover:bg-awn-primary-soft transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [handleEditExistingAsset, handleOpenAssetDetails, isRtl, t]
  );

  // ============================================================================
  // STEP 1: CHOOSE DOCUMENTS
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
            onClick={() => setFlowStep('list')}
          >
            {t('complianceAssets.backToComplianceAssets')}
          </Button>
          <span className="text-xs text-awn-text-muted">
            {t('complianceAssets.stepNoticeChoose')}
          </span>
        </div>

        <FlowProgressHeader
          currentStep="choose-documents"
          onStepClick={setFlowStep}
          isEditingExisting={Boolean(editingAssetId)}
        />

        <PageHeader
          title={t('complianceAssets.chooseDocsTitle')}
          description={t('complianceAssets.chooseDocsDesc')}
          secondaryActions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allIds = docOptions.map((d) => d.id);
                setSelectedDocuments(
                  selectedDocuments.length === allIds.length
                    ? ['Operations Card Info']
                    : allIds
                );
              }}
            >
              {selectedDocuments.length === docOptions.length
                ? t('complianceAssets.resetDefaultDocs')
                : t('complianceAssets.selectAllDocs')}
            </Button>
          }
        />

        <form onSubmit={handleChooseDocumentsSubmit} className="space-y-6">
          {/* Selected Documents Summary */}
          <Card
            title={t('complianceAssets.selectedDocsTitle')}
            description={t('complianceAssets.selectedDocsDesc')}
          >
            {selectedDocuments.length === 0 ? (
              <p className="text-xs text-awn-text-muted">
                {t('complianceAssets.noDocsSelected')}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {selectedDocuments.map((docId) => {
                  const displayLabel = getComplianceDocTitle(docId);
                  return (
                    <div
                      key={docId}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-awn-primary-soft border border-awn-primary text-xs font-semibold text-awn-primary"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{displayLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Available Documents List (Exact 5 Supplied Document Types) */}
          <Card
            title={t('complianceAssets.availableDocsTitle')}
            description={t('complianceAssets.availableDocsDesc')}
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setFlowStep('list')}
                >
                  {t('complianceAssets.goBack')}
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
                  {t('complianceAssets.submit')}
                </Button>
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {docOptions.map((doc) => {
                const isSelected = selectedDocuments.includes(doc.id);
                const title = getComplianceDocTitle(doc.id);
                const description = getComplianceDocDesc(doc.id, doc.description);

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
                            {t('complianceAssets.selectedBadge')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-awn-text-secondary mt-1 leading-relaxed">
                        {description}
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
  // STEP 2: ADD / EDIT COMPLIANCE ASSET FORM (Reusing FormSection Component)
  // ============================================================================
  if (flowStep === 'add-form') {
    const showDriverSection = selectedDocuments.includes('Driving License');
    const showRegistrationSection = selectedDocuments.includes('Vehicle Registration Info');
    const showFitnessSection = selectedDocuments.includes('Vehicle Fitness Info');
    const showInsuranceSection = selectedDocuments.includes('Insurance Information');
    const showOperationsCardSection = selectedDocuments.includes('Operations Card Info');

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
            onClick={() => setFlowStep('choose-documents')}
          >
            {t('complianceAssets.goBack')}
          </Button>
          <span className="text-xs text-awn-text-muted">
            {t('complianceAssets.stepNoticeForm')}
          </span>
        </div>

        <FlowProgressHeader
          currentStep="add-form"
          onStepClick={setFlowStep}
          isEditingExisting={Boolean(editingAssetId)}
        />

        <PageHeader
          title={
            editingAssetId
              ? t('complianceAssets.editingAssetTitle', { id: editingAssetId })
              : t('complianceAssets.step2')
          }
          description={t('complianceAssets.formNotice')}
          secondaryActions={
            <Button
              variant="outline"
              size="sm"
              onClick={handlePopulateDemoValues}
            >
              {t('complianceAssets.fillSampleData')}
            </Button>
          }
        />

        <form onSubmit={handleSubmitComplianceAsset} noValidate className="space-y-6">
          <Card>
            <div className="divide-y divide-awn-border">
              {/* SECTION 1: BASIC DETAILS */}
              <FormSection
                stepNumber="01"
                title={t('complianceAssets.basicDetails')}
                description={t('complianceAssets.basicDetailsDesc')}
                columns={2}
              >
                <Select
                  label={t('complianceAssets.language')}
                  required
                  options={localizedSelectOpts.languages}
                  value={formData.basicDetails.language}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'language', e.target.value)
                  }
                />
                <Select
                  label={t('complianceAssets.customer')}
                  required
                  options={localizedSelectOpts.customers}
                  value={formData.basicDetails.customer}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'customer', e.target.value)
                  }
                  error={formErrors['basicDetails.customer']}
                />
                <Select
                  label={t('complianceAssets.business')}
                  required
                  options={localizedSelectOpts.businesses}
                  value={formData.basicDetails.business}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'business', e.target.value)
                  }
                  error={formErrors['basicDetails.business']}
                />
                <Select
                  label={t('complianceAssets.assetsCategory')}
                  required
                  options={localizedSelectOpts.assetCategories}
                  value={formData.basicDetails.assetsCategory}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'assetsCategory', e.target.value)
                  }
                  error={formErrors['basicDetails.assetsCategory']}
                />
                <Select
                  label={t('complianceAssets.compliance')}
                  required
                  options={localizedSelectOpts.complianceTypes}
                  value={formData.basicDetails.compliance}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'compliance', e.target.value)
                  }
                />
                <Select
                  label={t('complianceAssets.assetsType')}
                  required
                  options={localizedSelectOpts.assetTypes}
                  value={formData.basicDetails.assetsType}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'assetsType', e.target.value)
                  }
                  error={formErrors['basicDetails.assetsType']}
                />
              </FormSection>

              {/* SECTION 2: VEHICLE INFORMATION */}
              <FormSection
                stepNumber="02"
                title={t('complianceAssets.vehicleInfo')}
                description={t('complianceAssets.vehicleInfoDesc')}
                columns={2}
              >
                <Select
                  label={t('complianceAssets.language')}
                  required
                  options={localizedSelectOpts.languages}
                  value={formData.vehicleInfo.language}
                  onChange={(e) =>
                    updateSectionField('vehicleInfo', 'language', e.target.value)
                  }
                />
                <Input
                  label={t('complianceAssets.plateNumberEn')}
                  required
                  placeholder="e.g., KSA 4829 RYD"
                  value={formData.vehicleInfo.plateNumberEn}
                  onChange={(e) =>
                    updateSectionField('vehicleInfo', 'plateNumberEn', e.target.value)
                  }
                  error={formErrors['vehicleInfo.plateNumberEn']}
                />
                <Input
                  label={t('complianceAssets.plateNumberAr')}
                  required
                  placeholder="e.g., أ ب ج ٤٨٢٩"
                  value={formData.vehicleInfo.plateNumberAr}
                  onChange={(e) =>
                    updateSectionField('vehicleInfo', 'plateNumberAr', e.target.value)
                  }
                  error={formErrors['vehicleInfo.plateNumberAr']}
                />
                <Input
                  label={t('complianceAssets.ownerName')}
                  required
                  placeholder="e.g., Advanced Tech Co."
                  value={formData.vehicleInfo.ownerName}
                  onChange={(e) =>
                    updateSectionField('vehicleInfo', 'ownerName', e.target.value)
                  }
                  error={formErrors['vehicleInfo.ownerName']}
                />
                <Input
                  label={t('complianceAssets.ownerId')}
                  required
                  placeholder="e.g., 7001928345"
                  value={formData.vehicleInfo.ownerId}
                  onChange={(e) =>
                    updateSectionField('vehicleInfo', 'ownerId', e.target.value)
                  }
                  error={formErrors['vehicleInfo.ownerId']}
                />
                <Input
                  label={t('complianceAssets.serialNumber')}
                  required
                  placeholder="e.g., SN-ACTROS-994120"
                  value={formData.vehicleInfo.serialNumber}
                  onChange={(e) =>
                    updateSectionField('vehicleInfo', 'serialNumber', e.target.value)
                  }
                  error={formErrors['vehicleInfo.serialNumber']}
                />
                <div className="sm:col-span-2">
                  <Input
                    label={t('complianceAssets.vinNumber')}
                    required
                    placeholder="e.g., WDB9634031L884920"
                    value={formData.vehicleInfo.vinNumber}
                    onChange={(e) =>
                      updateSectionField('vehicleInfo', 'vinNumber', e.target.value)
                    }
                    error={formErrors['vehicleInfo.vinNumber']}
                  />
                </div>
              </FormSection>

              {/* SECTION 3: DRIVER INFORMATION (Shown when Driving License is selected) */}
              {showDriverSection && (
                <FormSection
                  stepNumber="03"
                  title={t('complianceAssets.driverInfo')}
                  description={t('complianceAssets.driverInfoDesc')}
                  columns={2}
                >
                  <Select
                    label={t('complianceAssets.language')}
                    required
                    options={localizedSelectOpts.languages}
                    value={formData.driverInfo.language}
                    onChange={(e) =>
                      updateSectionField('driverInfo', 'language', e.target.value)
                    }
                  />
                  <Input
                    label={t('complianceAssets.driverId')}
                    required
                    placeholder="e.g., 1084920314"
                    value={formData.driverInfo.driverId}
                    onChange={(e) =>
                      updateSectionField('driverInfo', 'driverId', e.target.value)
                    }
                    error={formErrors['driverInfo.driverId']}
                  />
                  <Input
                    label={t('complianceAssets.driverName')}
                    required
                    placeholder="e.g., Salman Al-Ghamdi"
                    value={formData.driverInfo.driverName}
                    onChange={(e) =>
                      updateSectionField('driverInfo', 'driverName', e.target.value)
                    }
                    error={formErrors['driverInfo.driverName']}
                  />
                  <FileCopyField
                    label={t('complianceAssets.driverLicenseCopy')}
                    required
                    value={formData.driverInfo.driverLicenseCopy}
                    onChange={(val) =>
                      updateSectionField('driverInfo', 'driverLicenseCopy', val)
                    }
                    error={formErrors['driverInfo.driverLicenseCopy']}
                    placeholder="e.g., Driver_License_Copy.pdf"
                    browseLabel={t('complianceAssets.browse')}
                  />
                </FormSection>
              )}

              {/* SECTION 4: DOCUMENTS INFORMATION */}
              <FormSection
                stepNumber="04"
                title={t('complianceAssets.documentsInfo')}
                description={t('complianceAssets.documentsInfoDesc')}
                columns={2}
              >
                <Select
                  label={t('complianceAssets.chooseTemplate')}
                  options={localizedSelectOpts.templates}
                  value={formData.documentsInfo.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  description={t('complianceAssets.chooseTemplateDesc')}
                />
                <div className="flex flex-col justify-center gap-2">
                  <span className="text-xs font-semibold text-awn-text-primary">
                    {t('complianceAssets.selectedDocSections')}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {docOptions.map((doc) => {
                      const active = selectedDocuments.includes(doc.id);
                      const title = getComplianceDocTitle(doc.id);
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

              {/* SECTION 5: VEHICLE REGISTRATION DETAILS */}
              {showRegistrationSection && (
                <FormSection
                  stepNumber="05"
                  title={t('complianceAssets.registrationDetails')}
                  description={t('complianceAssets.registrationDetailsDesc')}
                  columns={2}
                >
                  <Select
                    label={t('complianceAssets.registrationType')}
                    required
                    options={localizedSelectOpts.registrationTypes}
                    value={formData.registrationDetails.registrationType}
                    onChange={(e) =>
                      updateSectionField(
                        'registrationDetails',
                        'registrationType',
                        e.target.value
                      )
                    }
                  />
                  <Select
                    label={t('complianceAssets.vehicleCategory')}
                    required
                    options={localizedSelectOpts.vehicleCategories}
                    value={formData.registrationDetails.vehicleCategory}
                    onChange={(e) =>
                      updateSectionField(
                        'registrationDetails',
                        'vehicleCategory',
                        e.target.value
                      )
                    }
                  />
                  <Input
                    label={t('complianceAssets.brand')}
                    required
                    placeholder="e.g., Mercedes-Benz Actros 2645"
                    value={formData.registrationDetails.brand}
                    onChange={(e) =>
                      updateSectionField('registrationDetails', 'brand', e.target.value)
                    }
                    error={formErrors['registrationDetails.brand']}
                  />
                  <Input
                    label={t('complianceAssets.color')}
                    required
                    placeholder="e.g., White"
                    value={formData.registrationDetails.color}
                    onChange={(e) =>
                      updateSectionField('registrationDetails', 'color', e.target.value)
                    }
                    error={formErrors['registrationDetails.color']}
                  />
                  <Input
                    label={t('complianceAssets.registrationIssueDate')}
                    type="date"
                    required
                    value={formData.registrationDetails.registrationIssueDate}
                    onChange={(e) =>
                      updateSectionField(
                        'registrationDetails',
                        'registrationIssueDate',
                        e.target.value
                      )
                    }
                    error={formErrors['registrationDetails.registrationIssueDate']}
                  />
                  <Input
                    label={t('complianceAssets.registrationValidityDate')}
                    type="date"
                    required
                    value={formData.registrationDetails.registrationValidityDate}
                    onChange={(e) =>
                      updateSectionField(
                        'registrationDetails',
                        'registrationValidityDate',
                        e.target.value
                      )
                    }
                    error={formErrors['registrationDetails.registrationValidityDate']}
                  />
                  <Input
                    label={t('complianceAssets.manufacturingYear')}
                    required
                    placeholder="e.g., 2026"
                    value={formData.registrationDetails.manufacturingYear}
                    onChange={(e) =>
                      updateSectionField(
                        'registrationDetails',
                        'manufacturingYear',
                        e.target.value
                      )
                    }
                  />
                  <FileCopyField
                    label={t('complianceAssets.registrationCopy')}
                    required
                    value={formData.registrationDetails.registrationCopy}
                    onChange={(val) =>
                      updateSectionField('registrationDetails', 'registrationCopy', val)
                    }
                    error={formErrors['registrationDetails.registrationCopy']}
                    placeholder="e.g., Istimara_Registration_Copy.pdf"
                    browseLabel={t('complianceAssets.browse')}
                  />
                </FormSection>
              )}

              {/* SECTION 6: FITNESS DETAILS */}
              {showFitnessSection && (
                <FormSection
                  stepNumber="06"
                  title={t('complianceAssets.fitnessDetails')}
                  description={t('complianceAssets.fitnessDetailsDesc')}
                  columns={2}
                >
                  <Input
                    label={t('complianceAssets.fitnessName')}
                    required
                    placeholder="e.g., MVPI Periodic Technical Inspection"
                    value={formData.fitnessDetails.fitnessName}
                    onChange={(e) =>
                      updateSectionField('fitnessDetails', 'fitnessName', e.target.value)
                    }
                    error={formErrors['fitnessDetails.fitnessName']}
                  />
                  <Input
                    label={t('complianceAssets.fitnessNumber')}
                    required
                    placeholder="e.g., MVPI-RYD-2026-88412"
                    value={formData.fitnessDetails.fitnessNumber}
                    onChange={(e) =>
                      updateSectionField('fitnessDetails', 'fitnessNumber', e.target.value)
                    }
                    error={formErrors['fitnessDetails.fitnessNumber']}
                  />
                  <Input
                    label={t('complianceAssets.fitnessValidityDate')}
                    type="date"
                    value={formData.fitnessDetails.fitnessValidityDate}
                    onChange={(e) =>
                      updateSectionField(
                        'fitnessDetails',
                        'fitnessValidityDate',
                        e.target.value
                      )
                    }
                  />
                  <Input
                    label={t('complianceAssets.expiryDate')}
                    type="date"
                    required
                    value={formData.fitnessDetails.expiryDate}
                    onChange={(e) =>
                      updateSectionField('fitnessDetails', 'expiryDate', e.target.value)
                    }
                    error={formErrors['fitnessDetails.expiryDate']}
                  />
                  <Input
                    label={t('complianceAssets.renewalDate')}
                    type="date"
                    value={formData.fitnessDetails.renewalDate}
                    onChange={(e) =>
                      updateSectionField('fitnessDetails', 'renewalDate', e.target.value)
                    }
                  />
                  <FileCopyField
                    label={t('complianceAssets.fitnessDocumentCopy')}
                    required
                    value={formData.fitnessDetails.fitnessDocumentCopy}
                    onChange={(val) =>
                      updateSectionField('fitnessDetails', 'fitnessDocumentCopy', val)
                    }
                    error={formErrors['fitnessDetails.fitnessDocumentCopy']}
                    placeholder="e.g., MVPI_Fitness_Certificate.pdf"
                    browseLabel={t('complianceAssets.browse')}
                  />
                </FormSection>
              )}

              {/* SECTION 7: INSURANCE INFORMATION */}
              {showInsuranceSection && (
                <FormSection
                  stepNumber="07"
                  title={t('complianceAssets.insuranceInfo')}
                  description={t('complianceAssets.insuranceInfoDesc')}
                  columns={2}
                >
                  <Input
                    label={t('complianceAssets.policyName')}
                    required
                    placeholder="e.g., Tawuniya Commercial Fleet Master Policy"
                    value={formData.insuranceInfo.policyName}
                    onChange={(e) =>
                      updateSectionField('insuranceInfo', 'policyName', e.target.value)
                    }
                    error={formErrors['insuranceInfo.policyName']}
                  />
                  <Input
                    label={t('complianceAssets.insurancePolicyNumber')}
                    required
                    placeholder="e.g., POL-TAW-2026-99301"
                    value={formData.insuranceInfo.insurancePolicyNumber}
                    onChange={(e) =>
                      updateSectionField(
                        'insuranceInfo',
                        'insurancePolicyNumber',
                        e.target.value
                      )
                    }
                    error={formErrors['insuranceInfo.insurancePolicyNumber']}
                  />
                  <Select
                    label={t('complianceAssets.insuranceType')}
                    required
                    options={localizedSelectOpts.insuranceTypes}
                    value={formData.insuranceInfo.insuranceType}
                    onChange={(e) =>
                      updateSectionField('insuranceInfo', 'insuranceType', e.target.value)
                    }
                  />
                  <Input
                    label={t('complianceAssets.insuranceIssue')}
                    type="date"
                    value={formData.insuranceInfo.insuranceIssue}
                    onChange={(e) =>
                      updateSectionField('insuranceInfo', 'insuranceIssue', e.target.value)
                    }
                  />
                  <Input
                    label={t('complianceAssets.insuranceValidity')}
                    type="date"
                    required
                    value={formData.insuranceInfo.insuranceValidity}
                    onChange={(e) =>
                      updateSectionField(
                        'insuranceInfo',
                        'insuranceValidity',
                        e.target.value
                      )
                    }
                    error={formErrors['insuranceInfo.insuranceValidity']}
                  />
                  <Input
                    label={t('complianceAssets.renewalDate')}
                    type="date"
                    value={formData.insuranceInfo.renewalDate}
                    onChange={(e) =>
                      updateSectionField('insuranceInfo', 'renewalDate', e.target.value)
                    }
                  />
                  <div className="sm:col-span-2">
                    <FileCopyField
                      label={t('complianceAssets.operationsCardCopy')}
                      required
                      value={formData.insuranceInfo.operationsCardCopy}
                      onChange={(val) =>
                        updateSectionField('insuranceInfo', 'operationsCardCopy', val)
                      }
                      error={formErrors['insuranceInfo.operationsCardCopy']}
                      placeholder="e.g., Insurance_Policy_Schedule.pdf"
                      browseLabel={t('complianceAssets.browse')}
                    />
                  </div>
                </FormSection>
              )}

              {/* SECTION 8: OPERATIONS CARD INFO */}
              {showOperationsCardSection && (
                <FormSection
                  stepNumber="08"
                  title={t('complianceAssets.operationsCardInfo')}
                  description={t('complianceAssets.operationsCardInfoDesc')}
                  columns={2}
                >
                  <Input
                    label={t('complianceAssets.cardName')}
                    required
                    placeholder="e.g., TGA Commercial Transport Operations Card"
                    value={formData.operationsCardInfo.cardName}
                    onChange={(e) =>
                      updateSectionField('operationsCardInfo', 'cardName', e.target.value)
                    }
                    error={formErrors['operationsCardInfo.cardName']}
                  />
                  <Input
                    label={t('complianceAssets.cardNumber')}
                    required
                    placeholder="e.g., TGA-OP-2026-55190"
                    value={formData.operationsCardInfo.cardNumber}
                    onChange={(e) =>
                      updateSectionField('operationsCardInfo', 'cardNumber', e.target.value)
                    }
                    error={formErrors['operationsCardInfo.cardNumber']}
                  />
                  <Input
                    label={t('complianceAssets.issueDate')}
                    type="date"
                    required
                    value={formData.operationsCardInfo.issueDate}
                    onChange={(e) =>
                      updateSectionField('operationsCardInfo', 'issueDate', e.target.value)
                    }
                    error={formErrors['operationsCardInfo.issueDate']}
                  />
                  <Input
                    label={t('complianceAssets.expiryDate')}
                    type="date"
                    required
                    value={formData.operationsCardInfo.expiryDate}
                    onChange={(e) =>
                      updateSectionField('operationsCardInfo', 'expiryDate', e.target.value)
                    }
                    error={formErrors['operationsCardInfo.expiryDate']}
                  />
                  <Input
                    label={t('complianceAssets.renewalDate')}
                    type="date"
                    value={formData.operationsCardInfo.renewalDate}
                    onChange={(e) =>
                      updateSectionField(
                        'operationsCardInfo',
                        'renewalDate',
                        e.target.value
                      )
                    }
                  />
                  <FileCopyField
                    label={t('complianceAssets.operationsCardCopy')}
                    required
                    value={formData.operationsCardInfo.operationsCardCopy}
                    onChange={(val) =>
                      updateSectionField(
                        'operationsCardInfo',
                        'operationsCardCopy',
                        val
                      )
                    }
                    error={formErrors['operationsCardInfo.operationsCardCopy']}
                    placeholder="e.g., TGA_Operations_Card_Copy.pdf"
                    browseLabel={t('complianceAssets.browse')}
                  />
                </FormSection>
              )}
            </div>
          </Card>

          {/* FORM FOOTER ACTIONS: Go Back | Save as Draft | Submit */}
          <div className="bg-awn-surface border border-awn-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-awn-text-secondary">
              {t('complianceAssets.formNotice')}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setFlowStep('choose-documents')}
                disabled={submitting}
              >
                {t('complianceAssets.goBack')}
              </Button>
              <Button
                variant="gold"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveAsDraft}
                loading={submitting}
              >
                {t('complianceAssets.saveAsDraft')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                loading={submitting}
              >
                {t('complianceAssets.submit')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ============================================================================
  // STEP 3: ASSET DETAILS & ASSET DOCUMENT MATRIX
  // ============================================================================
  if (flowStep === 'details' && activeAsset) {
    const basic = activeAsset.basicDetails;
    const vehicle = activeAsset.vehicleInfo;
    const driver = activeAsset.driverInfo;
    const reg = activeAsset.registrationDetails;
    const fitness = activeAsset.fitnessDetails;
    const ins = activeAsset.insuranceInfo;
    const ops = activeAsset.operationsCardInfo;
    const isRetired = activeAsset.status === 'Retired';
    const isDraft = activeAsset.status === 'Draft';
    const displayStatusLabel =
      activeAsset.status === 'Compliant' ? 'Active' : activeAsset.status;

    // Exact 5 Documents in the Asset Document Matrix
    const documentMatrixRows: AssetDocument[] = [
      {
        documentName: 'Driver License',
        numberReference: driver.driverId || '—',
        issueDate: driver.licenseIssueDate || '—',
        expiryDate: driver.licenseExpiryDate || '—',
        renewalDate: driver.licenseRenewalDate || '—',
        fileCopy: driver.driverLicenseCopy || null,
      },
      {
        documentName: 'Registration',
        numberReference: vehicle.plateNumberEn || vehicle.serialNumber || '—',
        issueDate: reg.registrationIssueDate || '—',
        expiryDate: reg.registrationValidityDate || '—',
        renewalDate: reg.registrationValidityDate || '—',
        fileCopy: reg.registrationCopy || null,
      },
      {
        documentName: 'Fitness Card',
        numberReference: fitness.fitnessNumber || '—',
        issueDate: fitness.fitnessValidityDate || '—',
        expiryDate: fitness.expiryDate || '—',
        renewalDate: fitness.renewalDate || '—',
        fileCopy: fitness.fitnessDocumentCopy || null,
      },
      {
        documentName: 'Insurance Policy',
        numberReference: ins.insurancePolicyNumber || '—',
        issueDate: ins.insuranceIssue || '—',
        expiryDate: ins.insuranceValidity || '—',
        renewalDate: ins.renewalDate || '—',
        fileCopy: ins.operationsCardCopy || null,
      },
      {
        documentName: 'Operations Card',
        numberReference: ops.cardNumber || '—',
        issueDate: ops.issueDate || '—',
        expiryDate: ops.expiryDate || '—',
        renewalDate: ops.renewalDate || '—',
        fileCopy: ops.operationsCardCopy || null,
      },
    ];

    return (
      <div className="space-y-6">
        {/* Top Navigation Context */}
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
              {t('complianceAssets.backToComplianceAssets')}
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

        <FlowProgressHeader
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
              {t('complianceAssets.dismiss')}
            </Button>
          </div>
        )}

        {/* Asset Details Header with Status & Required Actions */}
        <PageHeader
          title={t('complianceAssets.assetDetailsTitle')}
          description={`${activeAsset.code} · ${reg.brand || basic.assetsType || 'Compliance Asset'} · ${t('complianceAssets.plateNumber')}: ${vehicle.plateNumberEn || '—'} (${vehicle.plateNumberAr || '—'})`}
          secondaryActions={
            !isRetired && (
              <Button
                variant="dangerOutline"
                size="md"
                leftIcon={<Ban className="w-4 h-4" />}
                onClick={() => setRetireDialogOpen(true)}
              >
                {t('complianceAssets.retireDeactivateAsset')}
              </Button>
            )
          }
          primaryAction={
            <Button
              variant="primary"
              size="md"
              leftIcon={<Pencil className="w-4 h-4" />}
              onClick={() => handleEditExistingAsset(activeAsset)}
            >
              {t('complianceAssets.editAsset')}
            </Button>
          }
        />

        {/* Enterprise Entity & Status Overview Card */}
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
                  {basic.customer && basic.customer !== 'Advanced Tech Co.' && (
                    <span className="text-xs text-awn-text-secondary">
                      ({basic.customer})
                    </span>
                  )}
                  <StatusBadge
                    label={
                      isRetired
                        ? 'Retired'
                        : isDraft
                        ? 'Draft'
                        : displayStatusLabel
                    }
                    tone={activeAsset.statusTone}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-awn-text-secondary mt-1.5">
                  <span>
                    {t('complianceAssets.crNumber')}:{' '}
                    <strong className="font-mono text-awn-text-primary tabular-nums">
                      {activeAsset.crNumber || 'CR-1040123486'}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    {t('complianceAssets.unifiedId')}:{' '}
                    <strong className="font-mono text-awn-text-primary tabular-nums">
                      {activeAsset.unifiedId ||
                        (vehicle.ownerId ? `UNIFIED-${vehicle.ownerId}` : 'UNIFIED-7001928345')}
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
                    {t('complianceAssets.colStatus')}:{' '}
                    <strong className="text-awn-text-primary">
                      {isRtl
                        ? isRetired
                          ? t('complianceAssets.filterRetired')
                          : isDraft
                          ? t('complianceAssets.filterDraft')
                          : t('complianceAssets.filterActive')
                        : displayStatusLabel}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-awn-text-muted font-mono tabular-nums md:text-right rtl:md:text-left">
              <div>
                {t('complianceAssets.lastUpdated')}: {activeAsset.updatedAt}
              </div>
              <div className="mt-0.5">
                {t('complianceAssets.activeComplianceDocs', {
                  count: formatNumber(activeAsset.selectedDocuments?.length || 0),
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Information Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. Basic Details */}
          <Card title={t('complianceAssets.basicDetails')}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.language')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.language || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.customer')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.customer || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.business')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.business || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.assetsCategory')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.assetsCategory || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.compliance')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.compliance || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.assetsType')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.assetsType || '—'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* 2. Basic Vehicle Information */}
          <Card title={t('complianceAssets.basicVehicleInfo')}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.language')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {vehicle.language || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.plateNumberEn')}</dt>
                <dd className="font-mono font-semibold text-awn-text-primary mt-1 tabular-nums">
                  {vehicle.plateNumberEn || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.plateNumberAr')}</dt>
                <dd className="font-semibold text-awn-text-primary mt-1">
                  {vehicle.plateNumberAr || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.ownerName')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {vehicle.ownerName || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.ownerId')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {vehicle.ownerId || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.serialNumber')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {vehicle.serialNumber || '—'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-awn-text-muted">{t('complianceAssets.vinNumber')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {vehicle.vinNumber || '—'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* 3. Driver Information */}
          <Card title={t('complianceAssets.driverInfo')}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.language')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {driver.language || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.driverId')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {driver.driverId || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.driverName')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {driver.driverName || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.driverLicenseCopy')}</dt>
                <dd className="font-medium text-awn-primary mt-1 truncate">
                  {driver.driverLicenseCopy || t('complianceAssets.notAttached')}
                </dd>
              </div>
            </dl>
          </Card>

          {/* 4. Vehicle Registration Details */}
          <Card title={t('complianceAssets.registrationDetails')}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.registrationType')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {reg.registrationType || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.vehicleCategory')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {reg.vehicleCategory || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.brand')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {reg.brand || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.color')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {reg.color || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.registrationIssueDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {reg.registrationIssueDate || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.registrationValidityDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {reg.registrationValidityDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.manufacturingYear')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {reg.manufacturingYear || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.registrationCopy')}</dt>
                <dd className="font-medium text-awn-primary mt-1 truncate">
                  {reg.registrationCopy || t('complianceAssets.notAttached')}
                </dd>
              </div>
            </dl>
          </Card>

          {/* 5. Fitness Details */}
          <Card title={t('complianceAssets.fitnessDetails')}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.fitnessName')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {fitness.fitnessName || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.fitnessNumber')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {fitness.fitnessNumber || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.fitnessValidityDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {fitness.fitnessValidityDate || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.expiryDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {fitness.expiryDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.renewalDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {fitness.renewalDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.fitnessDocumentCopy')}</dt>
                <dd className="font-medium text-awn-primary mt-1 truncate">
                  {fitness.fitnessDocumentCopy || t('complianceAssets.notAttached')}
                </dd>
              </div>
            </dl>
          </Card>

          {/* 6. Insurance Information */}
          <Card title={t('complianceAssets.insuranceInfo')}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.policyName')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {ins.policyName || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.insurancePolicyNumber')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ins.insurancePolicyNumber || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.insuranceType')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {ins.insuranceType || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.insuranceIssue')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ins.insuranceIssue || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.insuranceValidity')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ins.insuranceValidity || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.renewalDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ins.renewalDate || '—'}
                </dd>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.operationsCardCopy')}</dt>
                <dd className="font-medium text-awn-primary mt-1 truncate">
                  {ins.operationsCardCopy || t('complianceAssets.notAttached')}
                </dd>
              </div>
            </dl>
          </Card>

          {/* 7. Operations Card Information */}
          <Card title={t('complianceAssets.operationsCardInfo')} className="lg:col-span-2">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.cardName')}</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {ops.cardName || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.cardNumber')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ops.cardNumber || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">{t('complianceAssets.issueDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ops.issueDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.expiryDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ops.expiryDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.renewalDate')}</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ops.renewalDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">{t('complianceAssets.operationsCardCopy')}</dt>
                <dd className="font-medium text-awn-primary mt-1 truncate">
                  {ops.operationsCardCopy || t('complianceAssets.notAttached')}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* 8. ASSET DOCUMENT MATRIX */}
        <Card
          title={t('complianceAssets.documentMatrixTitle')}
          description={t('complianceAssets.documentMatrixDesc')}
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-awn-surface-alt border-b border-awn-border text-xs font-semibold text-awn-text-secondary">
                  <th className="py-3 px-4 whitespace-nowrap">
                    {t('complianceAssets.colDocName')}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    {t('complianceAssets.colNumberRef')}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    {t('complianceAssets.colIssueDate')}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    {t('complianceAssets.colExpiryDate')}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">
                    {t('complianceAssets.colRenewalDate')}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap text-right rtl:text-left">
                    {t('complianceAssets.colFileCopy')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-awn-border text-sm">
                {documentMatrixRows.map((row) => (
                  <tr
                    key={row.documentName}
                    className="hover:bg-awn-surface-alt transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-awn-text-primary whitespace-nowrap">
                      {getMatrixDocName(row.documentName)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-awn-text-primary whitespace-nowrap tabular-nums">
                      {row.numberReference}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-awn-text-secondary whitespace-nowrap tabular-nums">
                      {row.issueDate}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-awn-text-secondary whitespace-nowrap tabular-nums">
                      {row.expiryDate}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-awn-text-secondary whitespace-nowrap tabular-nums">
                      {row.renewalDate}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right rtl:text-left">
                      {row.fileCopy ? (
                        <button
                          type="button"
                          onClick={() =>
                            showToast({
                              title: `${getMatrixDocName(row.documentName)}`,
                              description: `${row.fileCopy}`,
                              variant: 'info',
                            })
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-awn-primary hover:underline cursor-pointer"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{row.fileCopy}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-awn-text-muted">
                          {t('complianceAssets.notUploaded')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Success State Confirmation Modal (Reusing Existing Modal Component) */}
        <Modal
          isOpen={successModalOpen}
          onClose={() => setSuccessModalOpen(false)}
          title={t('complianceAssets.assetAddedSuccess')}
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
                {t('complianceAssets.goToAssetsWorkspace')}
              </Button>
              <Button
                variant="primary"
                onClick={() => setSuccessModalOpen(false)}
              >
                {t('complianceAssets.viewAssetDetails')}
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
                {t('complianceAssets.assetAddedDesc')}
              </p>
              <div className="p-2.5 rounded-md bg-awn-surface-alt border border-awn-border text-xs font-mono text-awn-text-secondary tabular-nums">
                {activeAsset.code} · {reg.brand || basic.assetsType} ·{' '}
                {t('complianceAssets.colStatus')}:{' '}
                {isRtl
                  ? isRetired
                    ? t('complianceAssets.filterRetired')
                    : isDraft
                    ? t('complianceAssets.filterDraft')
                    : t('complianceAssets.filterActive')
                  : displayStatusLabel}
              </div>
            </div>
          </div>
        </Modal>

        {/* Retire/Deactivate Confirmation Dialog */}
        <ConfirmDialog
          isOpen={retireDialogOpen}
          onClose={() => setRetireDialogOpen(false)}
          onConfirm={handleConfirmRetire}
          title={t('complianceAssets.confirmRetireTitle')}
          description={t('complianceAssets.confirmRetireDesc')}
          itemSummary={`${activeAsset.code} — ${reg.brand || basic.assetsType} (${vehicle.plateNumberEn || t('complianceAssets.noPlate')})`}
          confirmLabel={t('complianceAssets.confirmRetireButton')}
          cancelLabel={t('complianceAssets.cancel')}
          loading={submitting}
        >
          <Input
            label={t('complianceAssets.retireReasonLabel')}
            placeholder={t('complianceAssets.retireReasonPlaceholder')}
            value={retireReason}
            onChange={(e) => setRetireReason(e.target.value)}
          />
        </ConfirmDialog>
      </div>
    );
  }

  // ============================================================================
  // DEFAULT VIEW: COMPLIANCE ASSETS REGISTRY & ENTRY LIST
  // ============================================================================
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('complianceAssets.title')}
        description={t('complianceAssets.description')}
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
            {t('complianceAssets.backToAssets')}
          </Button>
        }
        primaryAction={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleStartNewComplianceAsset}
          >
            {t('complianceAssets.newComplianceAsset')}
          </Button>
        }
      />

      {/* Compliance Assets Table */}
      <DataTable
        title={t('complianceAssets.title')}
        columns={complianceColumns}
        data={paginatedComplianceList}
        count={complianceList.length}
        loading={loadingList}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        searchValue={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPageIndex(0);
        }}
        searchPlaceholder={t('complianceAssets.searchPlaceholder')}
        onAddNew={handleStartNewComplianceAsset}
        addNewLabel={t('complianceAssets.newComplianceAsset')}
        toolbarSlot={
          <div
            role="group"
            aria-label="Filter compliance assets by status"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-md bg-awn-surface-alt border border-awn-border"
          >
            {['ALL', 'Active', 'Compliance Due', 'Draft', 'Retired'].map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setPageIndex(0);
                  }}
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
        }
      />
    </div>
  );
}
