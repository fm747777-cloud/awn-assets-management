import type { PaginationState } from './common.ts';
import type { StatusTone } from './status.ts';

export type AssetCategoryName =
  | 'Devices'
  | 'Licenses'
  | 'Equipment'
  | 'Vehicles & Fleet'
  | 'IT Equipment'
  | 'Office Furniture'
  | 'Vehicles'
  | 'Real Estate'
  | 'Electronics & Devices';

export type AssetCategoryStatus = 'Active' | 'Inactive';

export interface AssetCategory {
  categoryId: string;
  categoryName: string;
  description: string;
  createdDate: string;
  status: AssetCategoryStatus;
  statusTone: StatusTone;
  language?: string;
}

export interface AssetCategoryFormData {
  categoryId: string;
  language: string;
  categoryName: string;
  description: string;
}

export interface AssetCategoryCreatePayload {
  categoryId?: string;
  language: string;
  categoryName: string;
  description: string;
}

export interface AssetCategoryUpdatePayload {
  language?: string;
  categoryName: string;
  description: string;
}

export interface AssetCategoriesQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AssetCategoriesQueryResponse {
  items: AssetCategory[];
  allMatchingItems: AssetCategory[];
  summaryTotalLabel: string;
  totalRecordsCount: number;
  activeCount: number;
  inactiveCount: number;
  pagination: PaginationState;
}
