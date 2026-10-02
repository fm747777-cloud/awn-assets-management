import type { PaginationState } from './common.ts';
import type { StatusTone } from './status.ts';

export type AssetTagStatus = 'Active' | 'Inactive';

export interface AssetTag {
  tagId: string;
  tagName: string;
  description: string;
  createdDate: string;
  status: AssetTagStatus;
  statusTone: StatusTone;
  language: string;

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

export interface AssetTagFormData {
  tagId: string;
  language: string;
  tagName: string;
  description: string;
}

export interface AssetTagCreatePayload {
  tagId?: string;
  language?: string;
  tagName: string;
  description: string;
}

export interface AssetTagUpdatePayload {
  language?: string;
  tagName: string;
  description: string;
}

export interface AssetTagsQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AssetTagsQueryResponse {
  items: AssetTag[];
  allMatchingItems: AssetTag[];
  summaryTotalLabel: string;
  totalRecordsCount: number;
  activeCount: number;
  inactiveCount: number;
  pagination: PaginationState;
}
