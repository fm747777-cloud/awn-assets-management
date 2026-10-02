import type { PaginationState } from './common.ts';
import type { StatusTone } from './status.ts';

export type AssetTypeStatus = 'Active' | 'Inactive';

export interface AssetType {
  typeId: string;
  typeName: string;
  category: string;
  description: string;
  createdDate: string;
  status: AssetTypeStatus;
  statusTone: StatusTone;
  language?: string;

  // Optional legacy WorkspaceRecordItem compatibility fields
  id?: string;
  code?: string;
  name?: string;
  type?: string;
  location?: string;
  custodian?: string;
  updatedAt?: string;
  classification?: string;
  serialNumber?: string;
  notes?: string;
}

export interface AssetTypeFormData {
  typeId: string;
  language: string;
  typeName: string;
  category: string;
  description: string;
}

export interface AssetTypeCreatePayload {
  typeId?: string;
  language: string;
  typeName: string;
  category: string;
  description: string;
}

export interface AssetTypeUpdatePayload {
  language?: string;
  typeName: string;
  category: string;
  description: string;
}

export interface AssetTypesQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AssetTypesQueryResponse {
  items: AssetType[];
  allMatchingItems: AssetType[];
  summaryTotalLabel: string;
  totalRecordsCount: number;
  activeCount: number;
  inactiveCount: number;
  pagination: PaginationState;
}
