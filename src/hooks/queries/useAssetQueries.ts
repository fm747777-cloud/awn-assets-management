import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assetModuleService } from '../../services/assetModuleService.ts';
import type {
  AssetCategoryFormData,
  AssetCategoryUpdatePayload,
  AssetStatusFormData,
  AssetStatusUpdatePayload,
  AssetTagFormData,
  AssetTagUpdatePayload,
  AssetTypeFormData,
  AssetTypeUpdatePayload,
  ComplianceAssetFormData,
  ComplianceDocumentId,
  NonComplianceAssetFormData,
  NonComplianceAssetSavePayload,
} from '../../types/index.ts';

export const assetQueryKeys = {
  all: ['assets'] as const,
  workspaceRecords: (params: Record<string, any>) => ['assets', 'workspace', params] as const,
  categories: (params: Record<string, any>) => ['assets', 'categories', params] as const,
  types: (params: Record<string, any>) => ['assets', 'types', params] as const,
  tags: (params: Record<string, any>) => ['assets', 'tags', params] as const,
  statuses: (params: Record<string, any>) => ['assets', 'statuses', params] as const,
  compliance: (params: Record<string, any>) => ['assets', 'compliance', params] as const,
  complianceDetail: (id: string) => ['assets', 'compliance', 'detail', id] as const,
  nonCompliance: (params: Record<string, any>) => ['assets', 'nonCompliance', params] as const,
  nonComplianceDetail: (id: string) => ['assets', 'nonCompliance', 'detail', id] as const,
};

// ============================================================================
// ASSET CATEGORIES
// ============================================================================
export function useAssetCategoriesQuery(params: { search?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: assetQueryKeys.categories(params),
    queryFn: () => assetModuleService.getAssetCategories(params),
  });
}

export function useCreateAssetCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetCategoryFormData) => assetModuleService.createAssetCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

export function useUpdateAssetCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetCategoryUpdatePayload }) =>
      assetModuleService.updateAssetCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

export function useDeleteAssetCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetModuleService.deleteAssetCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

// ============================================================================
// ASSET TYPES
// ============================================================================
export function useAssetTypesQuery(params: { search?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: assetQueryKeys.types(params),
    queryFn: () => assetModuleService.getAssetTypes(params),
  });
}

export function useCreateAssetTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetTypeFormData) => assetModuleService.createAssetType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'types'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

export function useUpdateAssetTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetTypeUpdatePayload }) =>
      assetModuleService.updateAssetType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'types'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

export function useDeleteAssetTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetModuleService.deleteAssetType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'types'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

// ============================================================================
// ASSET TAGS
// ============================================================================
export function useAssetTagsQuery(params: { search?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: assetQueryKeys.tags(params),
    queryFn: () => assetModuleService.getAssetTags(params),
  });
}

export function useCreateAssetTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetTagFormData) => assetModuleService.createAssetTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

export function useUpdateAssetTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetTagUpdatePayload }) =>
      assetModuleService.updateAssetTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

export function useDeleteAssetTagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetModuleService.deleteAssetTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

// ============================================================================
// ASSET STATUSES
// ============================================================================
export function useAssetStatusesQuery(params: { search?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: assetQueryKeys.statuses(params),
    queryFn: () => assetModuleService.getAssetStatuses(params),
  });
}

export function useCreateAssetStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetStatusFormData) => assetModuleService.createAssetStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'statuses'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

export function useUpdateAssetStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetStatusUpdatePayload }) =>
      assetModuleService.updateAssetStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'statuses'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

export function useDeactivateAssetStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => assetModuleService.deactivateAssetStatus(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'statuses'] });
    },
  });
}

export function useDeleteAssetStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => assetModuleService.deleteAssetStatus(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'statuses'] });
    },
  });
}

// ============================================================================
// COMPLIANCE ASSETS
// ============================================================================
export function useComplianceAssetsQuery(params: { search?: string; status?: string }) {
  return useQuery({
    queryKey: assetQueryKeys.compliance(params),
    queryFn: () => assetModuleService.getComplianceAssets(params),
  });
}

export function useComplianceAssetQuery(id?: string | null) {
  return useQuery({
    queryKey: assetQueryKeys.complianceDetail(id || ''),
    queryFn: () => (id ? assetModuleService.getComplianceAssetById(id) : null),
    enabled: Boolean(id),
  });
}

export function useSaveComplianceAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      options,
    }: {
      data: ComplianceAssetFormData & { selectedDocuments: ComplianceDocumentId[] };
      options?: { isDraft?: boolean; existingId?: string | null };
    }) => assetModuleService.saveComplianceAsset(data, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'compliance'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

export function useRetireComplianceAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      assetModuleService.retireComplianceAsset(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'compliance'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

// ============================================================================
// NON-COMPLIANCE ASSETS
// ============================================================================
export function useNonComplianceAssetsQuery(params: { search?: string; status?: string }) {
  return useQuery({
    queryKey: assetQueryKeys.nonCompliance(params),
    queryFn: () => assetModuleService.getNonComplianceAssets(params),
  });
}

export function useNonComplianceAssetQuery(id?: string | null) {
  return useQuery({
    queryKey: assetQueryKeys.nonComplianceDetail(id || ''),
    queryFn: () => (id ? assetModuleService.getNonComplianceAssetById(id) : null),
    enabled: Boolean(id),
  });
}

export function useSaveNonComplianceAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      options,
    }: {
      data: NonComplianceAssetSavePayload;
      options?: { isDraft?: boolean; existingId?: string | null };
    }) => assetModuleService.saveNonComplianceAsset(data, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'nonCompliance'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

export function useRetireNonComplianceAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      assetModuleService.retireNonComplianceAsset(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'nonCompliance'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}

export function useReassignNonComplianceAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      assignedTo,
      location,
    }: {
      id: string;
      assignedTo: string;
      location: string;
    }) =>
      assetModuleService.reassignNonComplianceAsset(id, {
        assignedTo,
        location,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'nonCompliance'] });
      queryClient.invalidateQueries({ queryKey: ['assets', 'workspace'] });
    },
  });
}
