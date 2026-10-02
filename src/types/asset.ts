import type { PaginationState, SelectOption, WorkspaceMetric } from './common.ts';
import type { AssetCategoryName } from './category.ts';
import type {
  AssetCondition,
  AssetOwnershipType,
  AssetStatusValue,
  ComplianceAssetStatus,
  DepreciationMethod,
  MasterRecordStatus,
  NonComplianceAssetStatus,
  StatusTone,
} from './status.ts';
import type {
  ComplianceDocumentId,
  DocumentsInformation,
  DriverInformation,
  FitnessInformation,
  InsuranceInformation,
  NonComplianceDocumentId,
  OperationsCard,
  VehicleRegistration,
  WarrantyDocument,
} from './document.ts';

export type AssetClassification = 'Compliance' | 'Non-Compliance';

export interface EmployeeRecord {
  name: string;
  role: string;
  department: string;
  location: string;
}

export interface EmployeeOption extends SelectOption {
  role: string;
  department: string;
  location: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  category: AssetCategoryName | string;
  type: string;
  classification: AssetClassification;
  serialNumber: string;
  status: AssetStatusValue | string;
  statusTone: StatusTone;
  assignedTo: string | null;
  assignedRole: string | null;
  department: string;
  location: string;
  assignedDate: string | null;
  updatedAt: string;
  value?: string;
  notes: string;
}

export interface AssetSummaryCounts {
  total: number;
  compliance: number;
  nonCompliance: number;
  assigned: number;
  available: number;
  attention: number;
  retired: number;
}

export interface AssetsQueryResponse {
  items: Asset[];
  allMatchingItems: Asset[];
  summaryCounts: AssetSummaryCounts;
  pagination: PaginationState;
}

export interface AssetEditFormValues {
  name: string;
  category: string;
  type: string;
  classification: AssetClassification;
  serialNumber: string;
  status: string;
  location: string;
  notes: string;
}

export interface AssetReassignFormValues {
  mode: 'assign' | 'unassign';
  employeeName: string;
  assignedRole: string;
  department: string;
  location: string;
  notes: string;
}

export interface AssetReassignPayload {
  assignedTo: string | null;
  assignedRole?: string | null;
  department?: string;
  location?: string;
  notes?: string;
}

export interface ComplianceBasicDetails {
  language: string;
  customer: string;
  business: string;
  assetsCategory: string;
  compliance: string;
  assetsType: string;
}

export interface VehicleInformation {
  language: string;
  plateNumberEn: string;
  plateNumberAr: string;
  ownerName: string;
  ownerId: string;
  serialNumber: string;
  vinNumber: string;
}

export type ComplianceVehicleInformation = VehicleInformation;

export interface ComplianceAssetFormData {
  basicDetails: ComplianceBasicDetails;
  vehicleInfo: VehicleInformation;
  driverInfo: DriverInformation;
  documentsInfo: DocumentsInformation;
  registrationDetails: VehicleRegistration;
  fitnessDetails: FitnessInformation;
  insuranceInfo: InsuranceInformation;
  operationsCardInfo: OperationsCard;
}

export type ComplianceAssetFormValues = ComplianceAssetFormData;

export interface ComplianceAsset extends ComplianceAssetFormData {
  id: string;
  code: string;
  crNumber?: string;
  unifiedId?: string;
  status: ComplianceAssetStatus;
  statusTone: StatusTone;
  updatedAt: string;
  selectedDocuments: ComplianceDocumentId[];
  retirementReason?: string;
}

export interface ComplianceAssetSavePayload extends ComplianceAssetFormData {
  selectedDocuments: ComplianceDocumentId[];
}

export interface ComplianceAssetsQueryResponse {
  items: ComplianceAsset[];
  total: number;
  draftCount: number;
  compliantCount: number;
}

export interface SelectOptionsCatalog {
  categories: SelectOption[];
  classifications: SelectOption<AssetClassification>[];
  statuses: SelectOption<AssetStatusValue>[];
  locations: SelectOption[];
}

export interface ComplianceSelectOptionsCatalog {
  languages: SelectOption[];
  customers: SelectOption[];
  businesses: SelectOption[];
  assetCategories: SelectOption[];
  complianceTypes: SelectOption[];
  assetTypes: SelectOption[];
  templates: SelectOption[];
  registrationTypes: SelectOption[];
  vehicleCategories: SelectOption[];
  insuranceTypes: SelectOption[];
}

export interface NonComplianceBasicDetails {
  language: string;
  customer: string;
  business: string;
  assetsCategory: string;
  compliance: string;
  assetsType: string;
}

export interface AssetIdentification {
  language: string;
  assetName: string;
  serialNumber: string;
  modelBrand: string;
  assetType: AssetOwnershipType | string;
  purchaseDate: string;
  warrantyExpiry: string;
  assignedTo: string;
}

export interface FinancialOwnershipDetails {
  purchaseValueSar: string;
  vendorSupplier: string;
  assetLocation: string;
  condition: AssetCondition | string;
  usefulLifeYears: string;
  depreciationMethod: DepreciationMethod | string;
  currentBookValue?: string;
}

export interface NonComplianceAssetFormData {
  basicDetails: NonComplianceBasicDetails;
  assetIdentification: AssetIdentification;
  documentsInfo: DocumentsInformation;
  financialOwnership: FinancialOwnershipDetails;
  warrantyDocument: WarrantyDocument;
}

export interface NonComplianceAsset extends NonComplianceAssetFormData {
  id: string;
  code: string;
  companyName: string;
  crNumber: string;
  unifiedId: string;
  status: NonComplianceAssetStatus;
  statusTone: StatusTone;
  updatedAt: string;
  selectedDocuments: NonComplianceDocumentId[];
  assignedRole?: string | null;
  department?: string;
  retirementReason?: string;
}

export interface NonComplianceAssetSavePayload extends NonComplianceAssetFormData {
  selectedDocuments: NonComplianceDocumentId[];
}

export interface NonComplianceAssetsQueryResponse {
  items: NonComplianceAsset[];
  total: number;
  draftCount: number;
  activeCount: number;
}

export interface NonComplianceSelectOptionsCatalog {
  languages: SelectOption[];
  customers: SelectOption[];
  businesses: SelectOption[];
  assetCategories: SelectOption[];
  complianceOptions: SelectOption[];
  assetsTypes: SelectOption[];
  ownershipAssetTypes: SelectOption<AssetOwnershipType>[];
  conditions: SelectOption<AssetCondition>[];
  depreciationMethods: SelectOption<DepreciationMethod>[];
  templates: SelectOption[];
  employees: EmployeeOption[];
}

export interface WorkspaceRecordItem {
  id: string;
  code: string;
  name: string;
  category: string;
  type: string;
  location: string;
  custodian: string;
  status: MasterRecordStatus | string;
  statusTone: StatusTone;
  updatedAt: string;
  classification: string;
  serialNumber: string;
  notes: string;
}

export interface WorkspaceSectionData<TItem = WorkspaceRecordItem> {
  metrics: WorkspaceMetric[];
  items: TItem[];
}

export interface InitialWorkspaceRecordsMap {
  dashboard: WorkspaceSectionData<WorkspaceRecordItem>;
  requests: WorkspaceSectionData<WorkspaceRecordItem>;
  'compliance-assets': WorkspaceSectionData<WorkspaceRecordItem>;
  'non-compliance-assets': WorkspaceSectionData<WorkspaceRecordItem>;
  'asset-categories': WorkspaceSectionData<WorkspaceRecordItem>;
  'asset-types': WorkspaceSectionData<WorkspaceRecordItem>;
  'asset-tags': WorkspaceSectionData<WorkspaceRecordItem>;
  'asset-status': WorkspaceSectionData<WorkspaceRecordItem>;
  'audit-trails': WorkspaceSectionData<WorkspaceRecordItem>;
  [key: string]: WorkspaceSectionData<WorkspaceRecordItem>;
}

export interface WorkspaceDataResponse {
  workspaceId: string;
  metrics: WorkspaceMetric[];
  items: WorkspaceRecordItem[];
  pagination: PaginationState;
}
