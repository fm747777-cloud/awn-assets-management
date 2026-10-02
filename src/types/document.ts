export type ComplianceDocumentId =
  | 'Insurance Information'
  | 'Operations Card Info'
  | 'Vehicle Registration Info'
  | 'Vehicle Fitness Info'
  | 'Driving License';

export interface ComplianceDocumentOption {
  id: ComplianceDocumentId;
  label: ComplianceDocumentId;
  shortLabel: string;
  description: string;
}

export interface DriverInformation {
  language: string;
  driverId: string;
  driverName: string;
  driverLicenseCopy: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  licenseRenewalDate?: string;
}

export interface DocumentsInformation {
  template: string;
}

export interface VehicleRegistration {
  registrationType: string;
  vehicleCategory: string;
  brand: string;
  color: string;
  registrationIssueDate: string;
  registrationValidityDate: string;
  manufacturingYear: string;
  registrationCopy: string;
}

export type VehicleRegistrationDetails = VehicleRegistration;

export interface FitnessInformation {
  fitnessName: string;
  fitnessNumber: string;
  fitnessValidityDate: string;
  expiryDate: string;
  renewalDate: string;
  fitnessDocumentCopy: string;
}

export type FitnessDetails = FitnessInformation;

export interface InsuranceInformation {
  policyName: string;
  insurancePolicyNumber: string;
  insuranceType: string;
  insuranceIssue: string;
  insuranceValidity: string;
  renewalDate: string;
  operationsCardCopy: string;
}

export interface OperationsCard {
  cardName: string;
  cardNumber: string;
  issueDate: string;
  expiryDate: string;
  renewalDate: string;
  operationsCardCopy: string;
}

export type OperationsCardInformation = OperationsCard;

export type DocumentMatrixName =
  | 'Driver License'
  | 'Registration'
  | 'Fitness Card'
  | 'Insurance Policy'
  | 'Operations Card';

export interface AssetDocument {
  documentName: DocumentMatrixName;
  numberReference: string;
  issueDate: string;
  expiryDate: string;
  renewalDate: string;
  fileCopy: string | null;
}

export type DocumentMatrixRow = AssetDocument;

export type NonComplianceDocumentId =
  | 'Warranty Document'
  | 'Financial & Ownership Details'
  | 'Proof of Ownership'
  | 'Driving License';

export interface NonComplianceDocument {
  id: NonComplianceDocumentId;
  label: NonComplianceDocumentId;
  description: string;
  defaultSelected?: boolean;
}

export interface WarrantyDocument {
  documentName: string;
  documentNumber: string;
  issueDate: string;
  renewalDate: string;
  expiryDate: string;
  validityDate?: string;
  uploadDocument: string;
}
