import React, { useCallback, useEffect, useState } from 'react';
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
          <span>Browse</span>
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
  const steps: Array<{
    id: ComplianceFlowStep;
    stepNum: string;
    label: string;
    subtitle: string;
  }> = [
    {
      id: 'choose-documents',
      stepNum: '01',
      label: 'Choose Documents',
      subtitle: 'Select required compliance documents',
    },
    {
      id: 'add-form',
      stepNum: '02',
      label: isEditingExisting ? 'Edit Compliance Asset' : 'Add Compliance Asset',
      subtitle: 'Complete vehicle & document sections',
    },
    {
      id: 'details',
      stepNum: '03',
      label: 'Asset Details',
      subtitle: 'Verification & Document Matrix',
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
              className={`text-left p-3 rounded-md border transition-colors flex items-center gap-3 ${
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
  const docOptions = assetModuleService.getComplianceDocumentOptions();
  const selectOpts = assetModuleService.getComplianceSelectOptions();

  // Flow steps: 'list' | 'choose-documents' | 'add-form' | 'details'
  const [flowStep, setFlowStep] = useState<ComplianceFlowStep>(() =>
    queryParams?.flow === 'new' ? 'choose-documents' : 'list'
  );

  // List State
  const [complianceList, setComplianceList] = useState<ComplianceAsset[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
        title: 'Select at least one document',
        description: 'Please select at least one compliance document section to proceed.',
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
      title: 'Sample values populated',
      description: 'Form fields populated with sample vehicle and compliance document data.',
      variant: 'info',
    });
  };

  const validateComplianceForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Basic Details validation
    if (!formData.basicDetails.customer) {
      errors['basicDetails.customer'] = 'Customer is required.';
    }
    if (!formData.basicDetails.business) {
      errors['basicDetails.business'] = 'Business unit is required.';
    }
    if (!formData.basicDetails.assetsCategory) {
      errors['basicDetails.assetsCategory'] = 'Assets Category is required.';
    }
    if (!formData.basicDetails.assetsType) {
      errors['basicDetails.assetsType'] = 'Assets type is required.';
    }

    // Vehicle Information validation
    if (!formData.vehicleInfo.plateNumberEn.trim()) {
      errors['vehicleInfo.plateNumberEn'] = 'Plate Number (English) is required.';
    }
    if (!formData.vehicleInfo.plateNumberAr.trim()) {
      errors['vehicleInfo.plateNumberAr'] = 'Plate Number (Arabic) is required.';
    }
    if (!formData.vehicleInfo.ownerName.trim()) {
      errors['vehicleInfo.ownerName'] = 'Owner Name is required.';
    }
    if (!formData.vehicleInfo.ownerId.trim()) {
      errors['vehicleInfo.ownerId'] = 'Owner ID is required.';
    }
    if (!formData.vehicleInfo.serialNumber.trim()) {
      errors['vehicleInfo.serialNumber'] = 'Serial Number is required.';
    }
    if (!formData.vehicleInfo.vinNumber.trim()) {
      errors['vehicleInfo.vinNumber'] = 'VIN Number is required.';
    }

    // Selected Document Sections validation
    if (selectedDocuments.includes('Driving License')) {
      if (!formData.driverInfo.driverId.trim()) {
        errors['driverInfo.driverId'] = 'Driver ID is required.';
      }
      if (!formData.driverInfo.driverName.trim()) {
        errors['driverInfo.driverName'] = 'Driver Name is required.';
      }
      if (!formData.driverInfo.driverLicenseCopy.trim()) {
        errors['driverInfo.driverLicenseCopy'] = 'Driver License Copy is required.';
      }
    }

    if (selectedDocuments.includes('Vehicle Registration Info')) {
      if (!formData.registrationDetails.brand.trim()) {
        errors['registrationDetails.brand'] = 'Brand is required.';
      }
      if (!formData.registrationDetails.color.trim()) {
        errors['registrationDetails.color'] = 'Color is required.';
      }
      if (!formData.registrationDetails.registrationIssueDate) {
        errors['registrationDetails.registrationIssueDate'] =
          'Registration Issue Date is required.';
      }
      if (!formData.registrationDetails.registrationValidityDate) {
        errors['registrationDetails.registrationValidityDate'] =
          'Registration Validity Date is required.';
      }
      if (!formData.registrationDetails.registrationCopy.trim()) {
        errors['registrationDetails.registrationCopy'] = 'Registration Copy is required.';
      }
    }

    if (selectedDocuments.includes('Vehicle Fitness Info')) {
      if (!formData.fitnessDetails.fitnessName.trim()) {
        errors['fitnessDetails.fitnessName'] = 'Fitness Name is required.';
      }
      if (!formData.fitnessDetails.fitnessNumber.trim()) {
        errors['fitnessDetails.fitnessNumber'] = 'Fitness Number is required.';
      }
      if (!formData.fitnessDetails.expiryDate) {
        errors['fitnessDetails.expiryDate'] = 'Expiry Date is required.';
      }
      if (!formData.fitnessDetails.fitnessDocumentCopy.trim()) {
        errors['fitnessDetails.fitnessDocumentCopy'] = 'Fitness Document Copy is required.';
      }
    }

    if (selectedDocuments.includes('Insurance Information')) {
      if (!formData.insuranceInfo.policyName.trim()) {
        errors['insuranceInfo.policyName'] = 'Policy Name is required.';
      }
      if (!formData.insuranceInfo.insurancePolicyNumber.trim()) {
        errors['insuranceInfo.insurancePolicyNumber'] =
          'Insurance Policy Number is required.';
      }
      if (!formData.insuranceInfo.insuranceValidity) {
        errors['insuranceInfo.insuranceValidity'] = 'Insurance Validity is required.';
      }
      if (!formData.insuranceInfo.operationsCardCopy.trim()) {
        errors['insuranceInfo.operationsCardCopy'] = 'Operations Card Copy is required.';
      }
    }

    if (selectedDocuments.includes('Operations Card Info')) {
      if (!formData.operationsCardInfo.cardName.trim()) {
        errors['operationsCardInfo.cardName'] = 'Card Name is required.';
      }
      if (!formData.operationsCardInfo.cardNumber.trim()) {
        errors['operationsCardInfo.cardNumber'] = 'Card Number is required.';
      }
      if (!formData.operationsCardInfo.issueDate) {
        errors['operationsCardInfo.issueDate'] = 'Issue Date is required.';
      }
      if (!formData.operationsCardInfo.expiryDate) {
        errors['operationsCardInfo.expiryDate'] = 'Expiry Date is required.';
      }
      if (!formData.operationsCardInfo.operationsCardCopy.trim()) {
        errors['operationsCardInfo.operationsCardCopy'] =
          'Operations Card Copy is required.';
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
        title: `Saved as Draft (${saved.code})`,
        message: `Draft ${saved.code} has been preserved in the mock service state. You can review its current details below or click "Edit Asset" at any time to complete and submit.`,
      });
      await loadComplianceList();
      showToast({
        title: `Saved as Draft (${saved.code})`,
        description: 'Entered compliance asset data has been preserved as a draft.',
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
        title: 'Required fields missing',
        description:
          'Please complete the highlighted required fields or use "Save as Draft" to continue later.',
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
      const successTitle = 'Asset Added Successfully!';
      const successDescription =
        'The asset has been recorded in the system. You can now assign it to an employee, track its status, and manage it from the Assets dashboard.';

      setActiveAsset(saved);
      setEditingAssetId(saved.id);
      setLastSubmissionBanner({
        type: 'submitted',
        title: successTitle,
        message: successDescription,
      });
      setSuccessModalOpen(true);
      await loadComplianceList();
      showToast({
        title: successTitle,
        description: successDescription,
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
      basicDetails: { ...EMPTY_COMPLIANCE_FORM.basicDetails, ...(asset.basicDetails || {}) },
      vehicleInfo: { ...EMPTY_COMPLIANCE_FORM.vehicleInfo, ...(asset.vehicleInfo || {}) },
      driverInfo: { ...EMPTY_COMPLIANCE_FORM.driverInfo, ...(asset.driverInfo || {}) },
      documentsInfo: { ...EMPTY_COMPLIANCE_FORM.documentsInfo, ...(asset.documentsInfo || {}) },
      registrationDetails: {
        ...EMPTY_COMPLIANCE_FORM.registrationDetails,
        ...(asset.registrationDetails || {}),
      },
      fitnessDetails: { ...EMPTY_COMPLIANCE_FORM.fitnessDetails, ...(asset.fitnessDetails || {}) },
      insuranceInfo: { ...EMPTY_COMPLIANCE_FORM.insuranceInfo, ...(asset.insuranceInfo || {}) },
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
        title: `Asset ${updated.code} Retired`,
        description: 'The compliance asset has been deactivated and marked as Retired.',
        variant: 'info',
      });
    } finally {
      setSubmitting(false);
    }
  };

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
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => setFlowStep('list')}
          >
            Back to Compliance Assets
          </Button>
          <span className="text-xs text-awn-text-muted">
            Step 1 of 3 · Document Scope Selection
          </span>
        </div>

        <FlowProgressHeader
          currentStep="choose-documents"
          onStepClick={setFlowStep}
          isEditingExisting={Boolean(editingAssetId)}
        />

        <PageHeader
          title="Choose Documents"
          description="Select the compliance document sections required for this asset. Your selection determines which relevant document sections appear in the Compliance Asset form."
          secondaryActions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allIds = docOptions.map((d) => d.id);
                setSelectedDocuments(
                  selectedDocuments.length === allIds.length ? ['Operations Card Info'] : allIds
                );
              }}
            >
              {selectedDocuments.length === docOptions.length
                ? 'Reset to Default (Operations Card)'
                : 'Select All Documents'}
            </Button>
          }
        />

        <form onSubmit={handleChooseDocumentsSubmit} className="space-y-6">
          {/* Selected Documents Summary */}
          <Card
            title="Selected Documents"
            description="These document sections will be displayed in the Add Compliance Asset form."
          >
            {selectedDocuments.length === 0 ? (
              <p className="text-xs text-awn-text-muted">
                No documents selected. Choose at least one document below to continue.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {selectedDocuments.map((docId) => {
                  const displayLabel =
                    docId === 'Operations Card Info' ? 'Operations Card' : docId;
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
            title="Available Documents"
            description="Select or deselect the statutory and operational documents required for this compliance asset."
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setFlowStep('list')}
                >
                  Go Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Submit
                </Button>
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {docOptions.map((doc) => {
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
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => setFlowStep('choose-documents')}
          >
            Go Back to Choose Documents
          </Button>
          <span className="text-xs text-awn-text-muted">
            Step 2 of 3 · Structured Compliance Data Capture
          </span>
        </div>

        <FlowProgressHeader
          currentStep="add-form"
          onStepClick={setFlowStep}
          isEditingExisting={Boolean(editingAssetId)}
        />

        <PageHeader
          title={editingAssetId ? `Edit Compliance Asset (${editingAssetId})` : 'Add Compliance Asset'}
          description="Complete the required asset, vehicle, and selected compliance document sections below. You can return to Choose Documents without losing entered values, save as a draft, or submit to view Asset Details."
          secondaryActions={
            <Button
              variant="outline"
              size="sm"
              onClick={handlePopulateDemoValues}
            >
              Fill Sample Data
            </Button>
          }
        />

        <form onSubmit={handleSubmitComplianceAsset} noValidate className="space-y-6">
          <Card>
            <div className="divide-y divide-awn-border">
              {/* SECTION 1: BASIC DETAILS */}
              <FormSection
                stepNumber="01"
                title="Basic Details"
                description="Organizational ownership, compliance mandate, and asset classification."
                columns={2}
              >
                <Select
                  label="Language"
                  required
                  options={selectOpts.languages}
                  value={formData.basicDetails.language}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'language', e.target.value)
                  }
                />
                <Select
                  label="Customer"
                  required
                  options={selectOpts.customers}
                  value={formData.basicDetails.customer}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'customer', e.target.value)
                  }
                  error={formErrors['basicDetails.customer']}
                />
                <Select
                  label="Business"
                  required
                  options={selectOpts.businesses}
                  value={formData.basicDetails.business}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'business', e.target.value)
                  }
                  error={formErrors['basicDetails.business']}
                />
                <Select
                  label="Assets Category"
                  required
                  options={selectOpts.assetCategories}
                  value={formData.basicDetails.assetsCategory}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'assetsCategory', e.target.value)
                  }
                  error={formErrors['basicDetails.assetsCategory']}
                />
                <Select
                  label="Compliance"
                  required
                  options={selectOpts.complianceTypes}
                  value={formData.basicDetails.compliance}
                  onChange={(e) =>
                    updateSectionField('basicDetails', 'compliance', e.target.value)
                  }
                />
                <Select
                  label="Assets type"
                  required
                  options={selectOpts.assetTypes}
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
                title="Vehicle Information"
                description="Bilingual registration plates, registered legal owner, serial reference, and chassis VIN."
                columns={2}
              >
                <Select
                  label="Language"
                  required
                  options={selectOpts.languages}
                  value={formData.vehicleInfo.language}
                  onChange={(e) =>
                    updateSectionField('vehicleInfo', 'language', e.target.value)
                  }
                />
                <Input
                  label="Plate Number (English)"
                  required
                  placeholder="e.g., KSA 4829 RYD"
                  value={formData.vehicleInfo.plateNumberEn}
                  onChange={(e) =>
                    updateSectionField('vehicleInfo', 'plateNumberEn', e.target.value)
                  }
                  error={formErrors['vehicleInfo.plateNumberEn']}
                />
                <Input
                  label="Plate Number (Arabic)"
                  required
                  placeholder="e.g., أ ب ج ٤٨٢٩"
                  value={formData.vehicleInfo.plateNumberAr}
                  onChange={(e) =>
                    updateSectionField('vehicleInfo', 'plateNumberAr', e.target.value)
                  }
                  error={formErrors['vehicleInfo.plateNumberAr']}
                />
                <Input
                  label="Owner Name"
                  required
                  placeholder="e.g., Advanced Tech Co."
                  value={formData.vehicleInfo.ownerName}
                  onChange={(e) =>
                    updateSectionField('vehicleInfo', 'ownerName', e.target.value)
                  }
                  error={formErrors['vehicleInfo.ownerName']}
                />
                <Input
                  label="Owner ID"
                  required
                  placeholder="e.g., 7001928345"
                  value={formData.vehicleInfo.ownerId}
                  onChange={(e) =>
                    updateSectionField('vehicleInfo', 'ownerId', e.target.value)
                  }
                  error={formErrors['vehicleInfo.ownerId']}
                />
                <Input
                  label="Serial Number"
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
                    label="VIN Number"
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
                  title="Driver Information"
                  description="Assigned operator identification and driving license copy."
                  columns={2}
                >
                  <Select
                    label="Language"
                    required
                    options={selectOpts.languages}
                    value={formData.driverInfo.language}
                    onChange={(e) =>
                      updateSectionField('driverInfo', 'language', e.target.value)
                    }
                  />
                  <Input
                    label="Driver ID"
                    required
                    placeholder="e.g., 1084920314"
                    value={formData.driverInfo.driverId}
                    onChange={(e) =>
                      updateSectionField('driverInfo', 'driverId', e.target.value)
                    }
                    error={formErrors['driverInfo.driverId']}
                  />
                  <Input
                    label="Driver Name"
                    required
                    placeholder="e.g., Salman Al-Ghamdi"
                    value={formData.driverInfo.driverName}
                    onChange={(e) =>
                      updateSectionField('driverInfo', 'driverName', e.target.value)
                    }
                    error={formErrors['driverInfo.driverName']}
                  />
                  <FileCopyField
                    label="Driver License Copy"
                    required
                    value={formData.driverInfo.driverLicenseCopy}
                    onChange={(val) =>
                      updateSectionField('driverInfo', 'driverLicenseCopy', val)
                    }
                    error={formErrors['driverInfo.driverLicenseCopy']}
                    placeholder="e.g., Driver_License_Copy.pdf"
                  />
                </FormSection>
              )}

              {/* SECTION 4: DOCUMENTS INFORMATION */}
              <FormSection
                stepNumber="04"
                title="Documents Information"
                description="Select a compliance document template or adjust which document sections are active."
                columns={2}
              >
                <Select
                  label="Choose Template"
                  options={selectOpts.templates}
                  value={formData.documentsInfo.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  description="Selecting a preset template automatically enables its corresponding document sections."
                />
                <div className="flex flex-col justify-center gap-2">
                  <span className="text-xs font-semibold text-awn-text-primary">
                    Selected Document Sections
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {docOptions.map((doc) => {
                      const active = selectedDocuments.includes(doc.id);
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
                          <span>{doc.label}</span>
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
                  title="Vehicle Registration Details"
                  description="Statutory vehicle registration (Istimara) parameters, validity dates, and document copy."
                  columns={2}
                >
                  <Select
                    label="Registration Type"
                    required
                    options={selectOpts.registrationTypes}
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
                    label="Vehicle Category"
                    required
                    options={selectOpts.vehicleCategories}
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
                    label="Brand"
                    required
                    placeholder="e.g., Mercedes-Benz Actros 2645"
                    value={formData.registrationDetails.brand}
                    onChange={(e) =>
                      updateSectionField('registrationDetails', 'brand', e.target.value)
                    }
                    error={formErrors['registrationDetails.brand']}
                  />
                  <Input
                    label="Color"
                    required
                    placeholder="e.g., White"
                    value={formData.registrationDetails.color}
                    onChange={(e) =>
                      updateSectionField('registrationDetails', 'color', e.target.value)
                    }
                    error={formErrors['registrationDetails.color']}
                  />
                  <Input
                    label="Registration Issue Date"
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
                    label="Registration Validity Date"
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
                    label="Manufacturing Year"
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
                    label="Registration Copy"
                    required
                    value={formData.registrationDetails.registrationCopy}
                    onChange={(val) =>
                      updateSectionField('registrationDetails', 'registrationCopy', val)
                    }
                    error={formErrors['registrationDetails.registrationCopy']}
                    placeholder="e.g., Istimara_Registration_Copy.pdf"
                  />
                </FormSection>
              )}

              {/* SECTION 6: FITNESS DETAILS */}
              {showFitnessSection && (
                <FormSection
                  stepNumber="06"
                  title="Fitness Details"
                  description="Periodic technical inspection (MVPI) certificate reference, validity window, and document copy."
                  columns={2}
                >
                  <Input
                    label="Fitness Name"
                    required
                    placeholder="e.g., MVPI Periodic Technical Inspection"
                    value={formData.fitnessDetails.fitnessName}
                    onChange={(e) =>
                      updateSectionField('fitnessDetails', 'fitnessName', e.target.value)
                    }
                    error={formErrors['fitnessDetails.fitnessName']}
                  />
                  <Input
                    label="Fitness Number"
                    required
                    placeholder="e.g., MVPI-RYD-2026-88412"
                    value={formData.fitnessDetails.fitnessNumber}
                    onChange={(e) =>
                      updateSectionField('fitnessDetails', 'fitnessNumber', e.target.value)
                    }
                    error={formErrors['fitnessDetails.fitnessNumber']}
                  />
                  <Input
                    label="Fitness Validity Date"
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
                    label="Expiry Date"
                    type="date"
                    required
                    value={formData.fitnessDetails.expiryDate}
                    onChange={(e) =>
                      updateSectionField('fitnessDetails', 'expiryDate', e.target.value)
                    }
                    error={formErrors['fitnessDetails.expiryDate']}
                  />
                  <Input
                    label="Renewal Date"
                    type="date"
                    value={formData.fitnessDetails.renewalDate}
                    onChange={(e) =>
                      updateSectionField('fitnessDetails', 'renewalDate', e.target.value)
                    }
                  />
                  <FileCopyField
                    label="Fitness Document Copy"
                    required
                    value={formData.fitnessDetails.fitnessDocumentCopy}
                    onChange={(val) =>
                      updateSectionField('fitnessDetails', 'fitnessDocumentCopy', val)
                    }
                    error={formErrors['fitnessDetails.fitnessDocumentCopy']}
                    placeholder="e.g., MVPI_Fitness_Certificate.pdf"
                  />
                </FormSection>
              )}

              {/* SECTION 7: INSURANCE INFORMATION */}
              {showInsuranceSection && (
                <FormSection
                  stepNumber="07"
                  title="Insurance Information"
                  description="Motor/asset insurance policy coverage details, validity dates, and document copy."
                  columns={2}
                >
                  <Input
                    label="Policy Name"
                    required
                    placeholder="e.g., Tawuniya Commercial Fleet Master Policy"
                    value={formData.insuranceInfo.policyName}
                    onChange={(e) =>
                      updateSectionField('insuranceInfo', 'policyName', e.target.value)
                    }
                    error={formErrors['insuranceInfo.policyName']}
                  />
                  <Input
                    label="Insurance Policy Number"
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
                    label="Insurance Type"
                    required
                    options={selectOpts.insuranceTypes}
                    value={formData.insuranceInfo.insuranceType}
                    onChange={(e) =>
                      updateSectionField('insuranceInfo', 'insuranceType', e.target.value)
                    }
                  />
                  <Input
                    label="Insurance Issue"
                    type="date"
                    value={formData.insuranceInfo.insuranceIssue}
                    onChange={(e) =>
                      updateSectionField('insuranceInfo', 'insuranceIssue', e.target.value)
                    }
                  />
                  <Input
                    label="Insurance Validity"
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
                    label="Renewal Date"
                    type="date"
                    value={formData.insuranceInfo.renewalDate}
                    onChange={(e) =>
                      updateSectionField('insuranceInfo', 'renewalDate', e.target.value)
                    }
                  />
                  <div className="sm:col-span-2">
                    <FileCopyField
                      label="Operations Card Copy"
                      required
                      value={formData.insuranceInfo.operationsCardCopy}
                      onChange={(val) =>
                        updateSectionField('insuranceInfo', 'operationsCardCopy', val)
                      }
                      error={formErrors['insuranceInfo.operationsCardCopy']}
                      placeholder="e.g., Insurance_Policy_Schedule.pdf"
                    />
                  </div>
                </FormSection>
              )}

              {/* SECTION 8: OPERATIONS CARD INFO */}
              {showOperationsCardSection && (
                <FormSection
                  stepNumber="08"
                  title="Operations Card Info"
                  description="Transport General Authority (TGA) or operational permit card details, validity dates, and copy."
                  columns={2}
                >
                  <Input
                    label="Card Name"
                    required
                    placeholder="e.g., TGA Commercial Transport Operations Card"
                    value={formData.operationsCardInfo.cardName}
                    onChange={(e) =>
                      updateSectionField('operationsCardInfo', 'cardName', e.target.value)
                    }
                    error={formErrors['operationsCardInfo.cardName']}
                  />
                  <Input
                    label="Card Number"
                    required
                    placeholder="e.g., TGA-OP-2026-55190"
                    value={formData.operationsCardInfo.cardNumber}
                    onChange={(e) =>
                      updateSectionField('operationsCardInfo', 'cardNumber', e.target.value)
                    }
                    error={formErrors['operationsCardInfo.cardNumber']}
                  />
                  <Input
                    label="Issue Date"
                    type="date"
                    required
                    value={formData.operationsCardInfo.issueDate}
                    onChange={(e) =>
                      updateSectionField('operationsCardInfo', 'issueDate', e.target.value)
                    }
                    error={formErrors['operationsCardInfo.issueDate']}
                  />
                  <Input
                    label="Expiry Date"
                    type="date"
                    required
                    value={formData.operationsCardInfo.expiryDate}
                    onChange={(e) =>
                      updateSectionField('operationsCardInfo', 'expiryDate', e.target.value)
                    }
                    error={formErrors['operationsCardInfo.expiryDate']}
                  />
                  <Input
                    label="Renewal Date"
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
                    label="Operations Card Copy"
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
                  />
                </FormSection>
              )}
            </div>
          </Card>

          {/* FORM FOOTER ACTIONS: Go Back | Save as Draft | Submit */}
          <div className="bg-awn-surface border border-awn-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-awn-text-secondary">
              Going back preserves your entered values. Submitting validates required fields and transitions to{' '}
              <strong className="text-awn-text-primary">Asset Details</strong>.
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setFlowStep('choose-documents')}
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
                Save as Draft
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
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setFlowStep('list')}
            >
              Back to Compliance Assets
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
              Dismiss
            </Button>
          </div>
        )}

        {/* Asset Details Header with Status & Required Actions */}
        <PageHeader
          title="Asset Details"
          description={`${activeAsset.code} · ${reg.brand || basic.assetsType || 'Compliance Asset'} · Plate: ${vehicle.plateNumberEn || '—'} (${vehicle.plateNumberAr || '—'})`}
          secondaryActions={
            !isRetired && (
              <Button
                variant="dangerOutline"
                size="md"
                leftIcon={<Ban className="w-4 h-4" />}
                onClick={() => setRetireDialogOpen(true)}
              >
                Retire / Deactivate Asset
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
              Edit Asset
            </Button>
          }
        />

        {/* Enterprise Entity & Status Overview Card (Advanced Tech Co. | CR-1040123486 | Unified ID | Status: Active) */}
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
                        : `Status: ${displayStatusLabel}`
                    }
                    tone={activeAsset.statusTone}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-awn-text-secondary mt-1.5">
                  <span>
                    CR Number:{' '}
                    <strong className="font-mono text-awn-text-primary tabular-nums">
                      {activeAsset.crNumber || 'CR-1040123486'}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Unified ID:{' '}
                    <strong className="font-mono text-awn-text-primary tabular-nums">
                      {activeAsset.unifiedId ||
                        (vehicle.ownerId ? `UNIFIED-${vehicle.ownerId}` : 'UNIFIED-7001928345')}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Asset Identifier:{' '}
                    <strong className="font-mono text-awn-text-primary tabular-nums">
                      {activeAsset.code}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Status:{' '}
                    <strong className="text-awn-text-primary">
                      {displayStatusLabel}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-awn-text-muted font-mono tabular-nums md:text-right">
              <div>Last Updated: {activeAsset.updatedAt}</div>
              <div className="mt-0.5">
                {activeAsset.selectedDocuments?.length || 0} Compliance Documents Active
              </div>
            </div>
          </div>
        </div>

        {/* Information Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. Basic Details */}
          <Card title="Basic Details">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Language</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.language || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Customer</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.customer || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Business</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.business || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Assets Category</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.assetsCategory || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Compliance</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.compliance || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Assets type</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {basic.assetsType || '—'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* 2. Basic Vehicle Information */}
          <Card title="Basic Vehicle Information">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Language</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {vehicle.language || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Plate Number (English)</dt>
                <dd className="font-mono font-semibold text-awn-text-primary mt-1 tabular-nums">
                  {vehicle.plateNumberEn || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Plate Number (Arabic)</dt>
                <dd className="font-semibold text-awn-text-primary mt-1">
                  {vehicle.plateNumberAr || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Owner Name</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {vehicle.ownerName || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Owner ID</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {vehicle.ownerId || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Serial Number</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {vehicle.serialNumber || '—'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-awn-text-muted">VIN Number</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {vehicle.vinNumber || '—'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* 3. Driver Information */}
          <Card title="Driver Information">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Language</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {driver.language || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Driver ID</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {driver.driverId || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Driver Name</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {driver.driverName || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Driver License Copy</dt>
                <dd className="font-medium text-awn-primary mt-1 truncate">
                  {driver.driverLicenseCopy || 'Not attached'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* 4. Vehicle Registration Details */}
          <Card title="Vehicle Registration Details">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Registration Type</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {reg.registrationType || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Vehicle Category</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {reg.vehicleCategory || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Brand</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {reg.brand || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Color</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {reg.color || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Registration Issue Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {reg.registrationIssueDate || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Registration Validity Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {reg.registrationValidityDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Manufacturing Year</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {reg.manufacturingYear || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Registration Copy</dt>
                <dd className="font-medium text-awn-primary mt-1 truncate">
                  {reg.registrationCopy || 'Not attached'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* 5. Fitness Details */}
          <Card title="Fitness Details">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Fitness Name</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {fitness.fitnessName || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Fitness Number</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {fitness.fitnessNumber || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Fitness Validity Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {fitness.fitnessValidityDate || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Expiry Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {fitness.expiryDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Renewal Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {fitness.renewalDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Fitness Document Copy</dt>
                <dd className="font-medium text-awn-primary mt-1 truncate">
                  {fitness.fitnessDocumentCopy || 'Not attached'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* 6. Insurance Information */}
          <Card title="Insurance Information">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Policy Name</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {ins.policyName || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Insurance Policy Number</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ins.insurancePolicyNumber || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Insurance Type</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {ins.insuranceType || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Insurance Issue</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ins.insuranceIssue || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Insurance Validity</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ins.insuranceValidity || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Renewal Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ins.renewalDate || '—'}
                </dd>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-awn-border">
                <dt className="text-awn-text-muted">Operations Card Copy</dt>
                <dd className="font-medium text-awn-primary mt-1 truncate">
                  {ins.operationsCardCopy || 'Not attached'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* 7. Operations Card Information */}
          <Card title="Operations Card Information" className="lg:col-span-2">
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5 text-xs">
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Card Name</dt>
                <dd className="font-medium text-awn-text-primary mt-1">
                  {ops.cardName || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Card Number</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ops.cardNumber || '—'}
                </dd>
              </div>
              <div className="pb-2.5 border-b border-awn-border">
                <dt className="text-awn-text-muted">Issue Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ops.issueDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Expiry Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ops.expiryDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Renewal Date</dt>
                <dd className="font-mono font-medium text-awn-text-primary mt-1 tabular-nums">
                  {ops.renewalDate || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-awn-text-muted">Operations Card Copy</dt>
                <dd className="font-medium text-awn-primary mt-1 truncate">
                  {ops.operationsCardCopy || 'Not attached'}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* 8. ASSET DOCUMENT MATRIX */}
        <Card
          title="Asset Document Matrix"
          description="Consolidated statutory document verification ledger across Driver License, Registration, Fitness Card, Insurance Policy, and Operations Card."
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-awn-surface-alt border-b border-awn-border text-xs font-semibold text-awn-text-secondary">
                  <th className="py-3 px-4 whitespace-nowrap">Document Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">Number/Reference</th>
                  <th className="py-3 px-4 whitespace-nowrap">Issue Date</th>
                  <th className="py-3 px-4 whitespace-nowrap">Expiry Date</th>
                  <th className="py-3 px-4 whitespace-nowrap">Renewal Date</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">File Copy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-awn-border text-sm">
                {documentMatrixRows.map((row) => (
                  <tr
                    key={row.documentName}
                    className="hover:bg-awn-surface-alt transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-awn-text-primary whitespace-nowrap">
                      {row.documentName}
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
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      {row.fileCopy ? (
                        <button
                          type="button"
                          onClick={() =>
                            showToast({
                              title: `Opening ${row.documentName} Copy`,
                              description: `Previewing file: ${row.fileCopy}`,
                              variant: 'info',
                            })
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-awn-primary hover:underline cursor-pointer"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{row.fileCopy}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-awn-text-muted">Not uploaded</span>
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
                The asset has been recorded in the system. You can now assign it to an employee, track its status, and manage it from the Assets dashboard.
              </p>
              <div className="p-2.5 rounded-md bg-awn-surface-alt border border-awn-border text-xs font-mono text-awn-text-secondary tabular-nums">
                {activeAsset.code} · {reg.brand || basic.assetsType} · Status: {displayStatusLabel}
              </div>
            </div>
          </div>
        </Modal>

        {/* Retire/Deactivate Confirmation Dialog */}
        <ConfirmDialog
          isOpen={retireDialogOpen}
          onClose={() => setRetireDialogOpen(false)}
          onConfirm={handleConfirmRetire}
          title="Retire / Deactivate Asset"
          description="Confirming this action will transition this Compliance Asset to Retired status and deactivate its operational dispatch eligibility."
          itemSummary={`${activeAsset.code} — ${reg.brand || basic.assetsType} (${vehicle.plateNumberEn || 'No Plate'})`}
          confirmLabel="Confirm Retire / Deactivate"
          loading={submitting}
        >
          <Input
            label="Reason for Retirement / Deactivation"
            placeholder="e.g., End of statutory service life or fleet replacement"
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
        title="Compliance Assets"
        description="Manage company assets governed by statutory, regulatory, vehicle registration, fitness, insurance, and operations card mandates."
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
            onClick={handleStartNewComplianceAsset}
          >
            New Compliance Asset
          </Button>
        }
      />

      {/* Compliance Assets Table */}
      <div className="bg-awn-surface border border-awn-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-awn-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by code, plate, VIN, driver, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              leftIcon={<Search className="w-4 h-4" />}
              aria-label="Search compliance assets"
            />
          </div>

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
        ) : complianceList.length === 0 ? (
          <EmptyState
            title="No Compliance Assets Found"
            description="Start the Compliance Asset flow to choose required documents and register a new compliance asset."
            primaryActionLabel="New Compliance Asset"
            onPrimaryAction={handleStartNewComplianceAsset}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-awn-surface-alt border-b border-awn-border text-xs font-semibold text-awn-text-secondary">
                  <th className="py-3 px-4 whitespace-nowrap">Asset ID</th>
                  <th className="py-3 px-4">Vehicle / Asset & Plate</th>
                  <th className="py-3 px-4 whitespace-nowrap">Customer & Business</th>
                  <th className="py-3 px-4 whitespace-nowrap">Assigned Driver</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-awn-border text-sm">
                {complianceList.map((item) => (
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
                        {item.selectedDocuments?.length || 0} Documents Linked
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <button
                        type="button"
                        onClick={() => handleOpenAssetDetails(item)}
                        className="font-medium text-awn-text-primary hover:text-awn-primary text-left cursor-pointer"
                      >
                        {item.registrationDetails?.brand ||
                          item.basicDetails?.assetsType ||
                          'Compliance Asset'}
                      </button>
                      <div className="text-xs text-awn-text-muted mt-0.5 font-mono tabular-nums">
                        {item.vehicleInfo?.plateNumberEn || 'No Plate'} ·{' '}
                        {item.vehicleInfo?.plateNumberAr || '—'} · VIN:{' '}
                        {item.vehicleInfo?.vinNumber || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="text-xs font-medium text-awn-text-primary">
                        {item.basicDetails?.customer || '—'}
                      </div>
                      <div className="text-xs text-awn-text-secondary mt-0.5">
                        {item.basicDetails?.business || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                      <div className="text-xs font-medium text-awn-text-primary">
                        {item.driverInfo?.driverName || 'Unassigned'}
                      </div>
                      <div className="text-xs text-awn-text-muted font-mono tabular-nums mt-0.5">
                        ID: {item.driverInfo?.driverId || '—'}
                      </div>
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
