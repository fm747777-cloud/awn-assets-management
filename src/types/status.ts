import type { PaginationState } from './common.ts';

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'gold' | 'neutral';

export type AssetStatusValue =
  | 'Assigned'
  | 'Available'
  | 'In Maintenance'
  | 'Compliance Due'
  | 'Retired';

export type ComplianceAssetStatus =
  | 'Active'
  | 'Compliant'
  | 'Compliance Due'
  | 'Draft'
  | 'Retired';

export type NonComplianceAssetStatus =
  | 'Active'
  | 'Assigned'
  | 'Available'
  | 'Draft'
  | 'Retired';

export type AssetOwnershipType = 'Owned' | 'Leased' | 'Rented' | 'Laptop';

export type AssetCondition = 'New' | 'Good' | 'Needs Repair' | 'Retired';

export type DepreciationMethod = 'Straight Line' | 'Declining Balance';

export type MasterRecordStatus =
  | 'Active'
  | 'Available'
  | 'Verified'
  | 'Pending Review'
  | 'Approved'
  | 'Inspection Due'
  | 'Compliant'
  | 'Compliance Due'
  | 'Assigned'
  | 'Retired';

export interface AssetStatusMaster {
  id: string;
  code: string;
  name: string;
  category: string;
  type: string;
  location: string;
  custodian: string;
  status: MasterRecordStatus;
  statusTone: StatusTone;
  updatedAt: string;
  classification: string;
  serialNumber: string;
  notes: string;
}

export type AssetStatusState = 'Active' | 'Deactivated';

export interface AssetStatus {
  statusCode: string;
  statusName: string;
  description: string;
  authorName: string;
  authorEmail: string;
  createdDate: string;
  language: string;
  status: AssetStatusState;
  statusTone: StatusTone;

  // Optional legacy fields for backward compatibility
  id?: string;
  code?: string;
  name?: string;
  category?: string;
  type?: string;
  location?: string;
  custodian?: string;
  updatedAt?: string;
  classification?: string;
  serialNumber?: string;
  notes?: string;
}

export interface AssetStatusFormData {
  statusCode: string;
  language: string;
  statusName: string;
  description: string;
}

export interface AssetStatusCreatePayload {
  statusCode?: string;
  language?: string;
  statusName: string;
  description?: string;
  authorName?: string;
  authorEmail?: string;
}

export interface AssetStatusUpdatePayload {
  language?: string;
  statusName: string;
  description: string;
}

export interface AssetStatusesQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AssetStatusesQueryResponse {
  items: AssetStatus[];
  allMatchingItems: AssetStatus[];
  summaryTotalLabel: string;
  totalRecordsCount: number;
  activeCount: number;
  deactivatedCount: number;
  pagination: PaginationState;
}
