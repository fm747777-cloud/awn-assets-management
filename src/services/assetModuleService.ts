/**
 * AWN (عَوْن) — Assets Module Service Abstraction Layer
 *
 * Provides clean asynchronous methods for:
 * - Main Assets Workspace (querying, searching, filtering, editing, reassigning, retiring/deactivating, CSV export)
 * - Compliance Assets Flow
 * - Non-Compliance Assets Flow
 * - Other Module Workspaces (Dashboard, Requests, Master, Audit Trails)
 */

import {
  ASSET_CATEGORIES_SUMMARY_LABEL,
  ASSET_STATUSES_SUMMARY_LABEL,
  ASSET_TAGS_SUMMARY_LABEL,
  ASSET_TYPES_SUMMARY_LABEL,
  COMPLIANCE_DOCUMENT_OPTIONS,
  COMPLIANCE_SELECT_OPTIONS,
  EMPLOYEE_DIRECTORY,
  INITIAL_ASSET_CATEGORIES,
  INITIAL_ASSET_STATUSES,
  INITIAL_ASSET_TAGS,
  INITIAL_ASSET_TYPES,
  INITIAL_ASSETS_LIST,
  INITIAL_COMPLIANCE_ASSETS,
  INITIAL_NON_COMPLIANCE_ASSETS,
  INITIAL_WORKSPACE_RECORDS,
  NON_COMPLIANCE_DOCUMENT_OPTIONS,
  NON_COMPLIANCE_SELECT_OPTIONS,
  SELECT_OPTIONS,
} from '../data/mockFoundationData.ts';
import type {
  Asset,
  AssetEditFormValues,
  AssetReassignPayload,
  AssetsQueryResponse,
  ComplianceAsset,
  ComplianceAssetSavePayload,
  ComplianceAssetsQueryResponse,
  ComplianceSelectOptionsCatalog,
  EmployeeRecord,
  InitialWorkspaceRecordsMap,
  NonComplianceAsset,
  NonComplianceAssetSavePayload,
  NonComplianceAssetsQueryResponse,
  NonComplianceSelectOptionsCatalog,
  SelectOptionsCatalog,
  WorkspaceDataResponse,
} from '../types/asset.ts';
import type {
  AssetCategoriesQueryParams,
  AssetCategoriesQueryResponse,
  AssetCategory,
  AssetCategoryCreatePayload,
  AssetCategoryUpdatePayload,
} from '../types/category.ts';
import type {
  AssetType,
  AssetTypeCreatePayload,
  AssetTypeUpdatePayload,
  AssetTypesQueryParams,
  AssetTypesQueryResponse,
} from '../types/assetType.ts';
import type {
  AssetTag,
  AssetTagCreatePayload,
  AssetTagUpdatePayload,
  AssetTagsQueryParams,
  AssetTagsQueryResponse,
} from '../types/tag.ts';
import type { SearchFilterParams } from '../types/common.ts';
import type {
  ComplianceDocumentOption,
  NonComplianceDocument,
} from '../types/document.ts';
import type {
  AssetStatus,
  AssetStatusCreatePayload,
  AssetStatusUpdatePayload,
  AssetStatusesQueryParams,
  AssetStatusesQueryResponse,
  ComplianceAssetStatus,
  NonComplianceAssetStatus,
  StatusTone,
} from '../types/status.ts';

function cloneDeep<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

let assetsStore: Asset[] = cloneDeep(INITIAL_ASSETS_LIST);
let complianceAssetsStore: ComplianceAsset[] = cloneDeep(INITIAL_COMPLIANCE_ASSETS);
let nonComplianceAssetsStore: NonComplianceAsset[] = cloneDeep(INITIAL_NON_COMPLIANCE_ASSETS);
let assetCategoriesStore: AssetCategory[] = cloneDeep(INITIAL_ASSET_CATEGORIES);
let nextCategorySequence = 6;
let assetTypesStore: AssetType[] = cloneDeep(INITIAL_ASSET_TYPES);
let nextTypeSequence = 6;
let assetTagsStore: AssetTag[] = cloneDeep(INITIAL_ASSET_TAGS);
let nextTagSequence = 6;
let assetStatusesStore: AssetStatus[] = cloneDeep(INITIAL_ASSET_STATUSES);
let nextStatusSequence = 6;
const memoryStore: InitialWorkspaceRecordsMap = cloneDeep(INITIAL_WORKSPACE_RECORDS);

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resolveToneForStatus(status?: string | null): StatusTone {
  const normalized = String(status || '').toLowerCase();
  if (
    normalized === 'assigned' ||
    normalized === 'active' ||
    normalized === 'compliant' ||
    normalized === 'approved' ||
    normalized === 'verified'
  ) {
    return 'success';
  }
  if (normalized === 'available' || normalized === 'under review') {
    return 'info';
  }
  if (normalized === 'draft') {
    return 'gold';
  }
  if (
    normalized === 'in maintenance' ||
    normalized === 'compliance due' ||
    normalized === 'inspection due' ||
    normalized === 'pending review'
  ) {
    return 'warning';
  }
  if (
    normalized === 'retired' ||
    normalized === 'deactivated' ||
    normalized === 'inactive'
  ) {
    return 'neutral';
  }
  return 'error';
}

export const assetModuleService = {
  /**
   * Query main Assets workspace with integrated search, classification filter, category filter, status filter, and pagination
   */
  async getAssets({
    search = '',
    classification = 'ALL',
    category = 'ALL',
    status = 'ALL',
    page = 1,
    pageSize = 8,
  }: SearchFilterParams = {}): Promise<AssetsQueryResponse> {
    await delay(140);

    const q = search.trim().toLowerCase();

    const filtered = assetsStore.filter((asset) => {
      const matchesSearch =
        !q ||
        asset.code.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        asset.category.toLowerCase().includes(q) ||
        asset.type.toLowerCase().includes(q) ||
        asset.serialNumber.toLowerCase().includes(q) ||
        Boolean(asset.assignedTo && asset.assignedTo.toLowerCase().includes(q)) ||
        Boolean(asset.department && asset.department.toLowerCase().includes(q)) ||
        Boolean(asset.location && asset.location.toLowerCase().includes(q));

      const matchesClassification =
        classification === 'ALL' ||
        asset.classification.toLowerCase() === classification.toLowerCase();

      const matchesCategory =
        category === 'ALL' || asset.category.toLowerCase() === category.toLowerCase();

      const matchesStatus =
        status === 'ALL' || asset.status.toLowerCase() === status.toLowerCase();

      return matchesSearch && matchesClassification && matchesCategory && matchesStatus;
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    const summaryCounts = {
      total: assetsStore.length,
      compliance: assetsStore.filter((a) => a.classification === 'Compliance').length,
      nonCompliance: assetsStore.filter((a) => a.classification === 'Non-Compliance').length,
      assigned: assetsStore.filter((a) => a.status === 'Assigned').length,
      available: assetsStore.filter((a) => a.status === 'Available').length,
      attention: assetsStore.filter(
        (a) => a.status === 'Compliance Due' || a.status === 'In Maintenance'
      ).length,
      retired: assetsStore.filter((a) => a.status === 'Retired').length,
    };

    return {
      items,
      allMatchingItems: filtered,
      summaryCounts,
      pagination: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  },

  /**
   * Update an asset's general attributes
   */
  async updateAsset(assetId: string, updates: Partial<AssetEditFormValues>): Promise<Asset> {
    await delay(200);
    const index = assetsStore.findIndex((a) => a.id === assetId);
    if (index === -1) {
      throw new Error(`Asset ${assetId} not found`);
    }

    const nextStatus = updates.status || assetsStore[index].status;
    const updated: Asset = {
      ...assetsStore[index],
      ...updates,
      status: nextStatus,
      statusTone: resolveToneForStatus(nextStatus),
      updatedAt: '2026-10-01 09:15',
    };

    assetsStore[index] = updated;

    // Synchronize if record also exists in nonComplianceAssetsStore
    const ncIdx = nonComplianceAssetsStore.findIndex((nc) => nc.id === assetId);
    if (ncIdx !== -1) {
      const currentNc = nonComplianceAssetsStore[ncIdx];
      nonComplianceAssetsStore[ncIdx] = {
        ...currentNc,
        status: nextStatus === 'Retired' ? 'Retired' : 'Active',
        statusTone: resolveToneForStatus(nextStatus === 'Retired' ? 'Retired' : 'Active'),
        updatedAt: '2026-10-01 09:15',
        basicDetails: {
          ...currentNc.basicDetails,
          assetsCategory: updates.category || currentNc.basicDetails.assetsCategory,
        },
        assetIdentification: {
          ...currentNc.assetIdentification,
          assetName: updates.name || currentNc.assetIdentification.assetName,
          serialNumber: updates.serialNumber || currentNc.assetIdentification.serialNumber,
          assetType: updates.type || currentNc.assetIdentification.assetType,
        },
        financialOwnership: {
          ...currentNc.financialOwnership,
          assetLocation: updates.location || currentNc.financialOwnership.assetLocation,
        },
      };
    }

    return updated;
  },

  /**
   * Reassign or Assign an asset to an employee / custodian or release to IT/Facility depot pool
   */
  async reassignAsset(
    assetId: string,
    { assignedTo, assignedRole, department, location, notes }: AssetReassignPayload
  ): Promise<Asset> {
    await delay(220);
    const index = assetsStore.findIndex((a) => a.id === assetId);
    if (index === -1) {
      throw new Error(`Asset ${assetId} not found`);
    }

    const isUnassigning = !assignedTo || assignedTo.trim() === '';
    const nextStatus = isUnassigning ? 'Available' : 'Assigned';

    const updated: Asset = {
      ...assetsStore[index],
      assignedTo: isUnassigning ? null : assignedTo.trim(),
      assignedRole: isUnassigning ? null : assignedRole?.trim() || 'Assigned Custodian',
      department: isUnassigning
        ? 'Central Inventory Pool'
        : department?.trim() || assetsStore[index].department,
      location: location || assetsStore[index].location,
      assignedDate: isUnassigning ? null : '2026-10-01',
      status: nextStatus,
      statusTone: resolveToneForStatus(nextStatus),
      notes: notes?.trim() ? notes.trim() : assetsStore[index].notes,
      updatedAt: '2026-10-01 09:18',
    };

    assetsStore[index] = updated;

    // Synchronize if record also exists in nonComplianceAssetsStore
    const ncIdx = nonComplianceAssetsStore.findIndex((nc) => nc.id === assetId);
    if (ncIdx !== -1) {
      const currentNc = nonComplianceAssetsStore[ncIdx];
      nonComplianceAssetsStore[ncIdx] = {
        ...currentNc,
        assignedRole: updated.assignedRole,
        department: updated.department,
        updatedAt: '2026-10-01 09:18',
        assetIdentification: {
          ...currentNc.assetIdentification,
          assignedTo: updated.assignedTo || '',
        },
        financialOwnership: {
          ...currentNc.financialOwnership,
          assetLocation: updated.location,
        },
      };
    }

    return updated;
  },

  /**
   * Retire / Deactivate an asset (destructive/irreversible lifecycle transition)
   */
  async retireAsset(
    assetId: string,
    {
      reason = '',
      targetLocation = 'Decommissioned Storage',
    }: { reason?: string; targetLocation?: string } = {}
  ): Promise<Asset> {
    await delay(240);
    const index = assetsStore.findIndex((a) => a.id === assetId);
    if (index === -1) {
      throw new Error(`Asset ${assetId} not found`);
    }

    const current = assetsStore[index];
    const updated: Asset = {
      ...current,
      status: 'Retired',
      statusTone: 'neutral',
      assignedTo: null,
      assignedRole: null,
      department: 'Decommissioned Inventory',
      location: targetLocation || current.location,
      assignedDate: null,
      notes: reason.trim()
        ? `Retired on 2026-10-01: ${reason.trim()}`
        : `Retired from active service on 2026-10-01. ${current.notes}`,
      updatedAt: '2026-10-01 09:20',
    };

    assetsStore[index] = updated;

    // Synchronize if record also exists in nonComplianceAssetsStore
    const ncIdx = nonComplianceAssetsStore.findIndex((nc) => nc.id === assetId);
    if (ncIdx !== -1) {
      nonComplianceAssetsStore[ncIdx] = {
        ...nonComplianceAssetsStore[ncIdx],
        status: 'Retired',
        statusTone: 'neutral',
        updatedAt: '2026-10-01 09:20',
        retirementReason: reason.trim() || 'Deactivated by user action.',
      };
    }

    return updated;
  },

  /**
   * Generate RFC-4180 compliant CSV string from current filtered or full mock asset dataset
   */
  generateAssetsCsv(records: Asset[] = assetsStore): string {
    const headers = [
      'Asset ID',
      'Asset Name',
      'Category',
      'Asset Type',
      'Classification',
      'Serial / License Key',
      'Status',
      'Assigned Employee',
      'Role',
      'Department',
      'Location',
      'Assigned Date',
      'Last Updated',
      'Notes',
    ];

    const escapeCsvCell = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((item) =>
      [
        item.code,
        item.name,
        item.category,
        item.type,
        item.classification,
        item.serialNumber,
        item.status,
        item.assignedTo || 'Unassigned',
        item.assignedRole || '-',
        item.department || '-',
        item.location || '-',
        item.assignedDate || '-',
        item.updatedAt || '-',
        item.notes || '',
      ]
        .map(escapeCsvCell)
        .join(',')
    );

    return [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  },

  getEmployeeDirectory(): EmployeeRecord[] {
    return EMPLOYEE_DIRECTORY;
  },

  getSelectOptions(): SelectOptionsCatalog {
    return SELECT_OPTIONS;
  },

  getComplianceDocumentOptions(): ComplianceDocumentOption[] {
    return COMPLIANCE_DOCUMENT_OPTIONS;
  },

  getComplianceSelectOptions(): ComplianceSelectOptionsCatalog {
    return COMPLIANCE_SELECT_OPTIONS;
  },

  /**
   * Retrieve all Compliance Assets (including saved drafts and submitted compliance assets)
   */
  async getComplianceAssets({
    search = '',
    status = 'ALL',
  }: { search?: string; status?: string } = {}): Promise<ComplianceAssetsQueryResponse> {
    await delay(140);
    const q = search.trim().toLowerCase();
    const filtered = complianceAssetsStore.filter((item) => {
      const matchesSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        (item.basicDetails?.assetsType || '').toLowerCase().includes(q) ||
        (item.basicDetails?.customer || '').toLowerCase().includes(q) ||
        (item.vehicleInfo?.plateNumberEn || '').toLowerCase().includes(q) ||
        (item.vehicleInfo?.plateNumberAr || '').toLowerCase().includes(q) ||
        (item.vehicleInfo?.vinNumber || '').toLowerCase().includes(q) ||
        (item.driverInfo?.driverName || '').toLowerCase().includes(q);

      const matchesStatus =
        status === 'ALL' ||
        item.status.toLowerCase() === status.toLowerCase() ||
        (status.toLowerCase() === 'active' && item.status.toLowerCase() === 'compliant') ||
        (status.toLowerCase() === 'compliant' && item.status.toLowerCase() === 'active');

      return matchesSearch && matchesStatus;
    });

    return {
      items: filtered,
      total: complianceAssetsStore.length,
      draftCount: complianceAssetsStore.filter((i) => i.status === 'Draft').length,
      compliantCount: complianceAssetsStore.filter(
        (i) => i.status === 'Active' || i.status === 'Compliant'
      ).length,
    };
  },

  async getComplianceAssetById(assetId: string): Promise<ComplianceAsset | null> {
    await delay(120);
    return complianceAssetsStore.find((item) => item.id === assetId) || null;
  },

  /**
   * Save as Draft OR Submit a Compliance Asset
   */
  async saveComplianceAsset(
    payload: ComplianceAssetSavePayload,
    {
      isDraft = false,
      existingId = null,
    }: { isDraft?: boolean; existingId?: string | null } = {}
  ): Promise<ComplianceAsset> {
    await delay(180);

    const status: ComplianceAssetStatus = isDraft ? 'Draft' : 'Active';
    const statusTone = resolveToneForStatus(status);
    const timestamp = '2026-10-01 10:30';
    const unifiedId = payload.vehicleInfo?.ownerId
      ? `UNIFIED-${payload.vehicleInfo.ownerId}`
      : 'UNIFIED-7001928345';

    let savedRecord: ComplianceAsset | undefined;

    if (existingId) {
      const idx = complianceAssetsStore.findIndex((item) => item.id === existingId);
      if (idx !== -1) {
        savedRecord = {
          ...complianceAssetsStore[idx],
          ...payload,
          crNumber: complianceAssetsStore[idx].crNumber || 'CR-1040123486',
          unifiedId,
          status,
          statusTone,
          updatedAt: timestamp,
        };
        complianceAssetsStore[idx] = savedRecord;
      }
    }

    if (!savedRecord) {
      const randomNum = Math.floor(410 + Math.random() * 580);
      const code = `CMP-2026-0${randomNum}`;
      savedRecord = {
        id: code,
        code,
        crNumber: 'CR-1040123486',
        unifiedId,
        status,
        statusTone,
        updatedAt: timestamp,
        ...payload,
      };
      complianceAssetsStore.unshift(savedRecord);
    }

    const mainAssetEntry: Asset = {
      id: savedRecord.id,
      code: savedRecord.code,
      name: `${savedRecord.registrationDetails?.brand || savedRecord.basicDetails?.assetsType || 'Compliance Vehicle'} (${savedRecord.vehicleInfo?.plateNumberEn || 'Pending Plate'})`,
      category: 'Equipment',
      type: savedRecord.basicDetails?.assetsType || 'Compliance Vehicle Asset',
      classification: 'Compliance',
      serialNumber:
        savedRecord.vehicleInfo?.serialNumber ||
        savedRecord.vehicleInfo?.vinNumber ||
        'Pending Serial',
      status: isDraft ? 'Available' : 'Assigned',
      statusTone: isDraft ? 'gold' : 'success',
      assignedTo:
        savedRecord.driverInfo?.driverName || savedRecord.vehicleInfo?.ownerName || null,
      assignedRole: 'Assigned Driver / Operator',
      department: savedRecord.basicDetails?.business || 'Fleet Operations',
      location: savedRecord.basicDetails?.customer || 'Riyadh HQ',
      assignedDate: '2026-10-01',
      updatedAt: timestamp,
      value: 'SAR —',
      notes: isDraft
        ? 'Compliance Asset saved as Draft.'
        : `Compliance Asset verified (${savedRecord.basicDetails?.compliance || 'Statutory Compliance'}).`,
    };

    const mainIdx = assetsStore.findIndex((a) => a.id === savedRecord.id);
    if (mainIdx !== -1) {
      assetsStore[mainIdx] = mainAssetEntry;
    } else {
      assetsStore.unshift(mainAssetEntry);
    }

    return savedRecord;
  },

  /**
   * Retire / Deactivate a Compliance Asset
   */
  async retireComplianceAsset(
    assetId: string,
    { reason = '' }: { reason?: string } = {}
  ): Promise<ComplianceAsset> {
    await delay(220);
    const idx = complianceAssetsStore.findIndex((item) => item.id === assetId);
    if (idx === -1) {
      throw new Error(`Compliance Asset ${assetId} not found`);
    }

    const updated: ComplianceAsset = {
      ...complianceAssetsStore[idx],
      status: 'Retired',
      statusTone: 'neutral',
      updatedAt: '2026-10-01 09:45',
      retirementReason: reason.trim() || 'Deactivated by user action.',
    };
    complianceAssetsStore[idx] = updated;

    const mainIdx = assetsStore.findIndex((a) => a.id === assetId);
    if (mainIdx !== -1) {
      assetsStore[mainIdx] = {
        ...assetsStore[mainIdx],
        status: 'Retired',
        statusTone: 'neutral',
        updatedAt: '2026-10-01 09:45',
      };
    }

    return updated;
  },

  // ==========================================================================
  // NON-COMPLIANCE ASSETS SERVICE METHODS (PHASE 3)
  // ==========================================================================

  getNonComplianceDocumentOptions(): NonComplianceDocument[] {
    return NON_COMPLIANCE_DOCUMENT_OPTIONS;
  },

  getNonComplianceSelectOptions(): NonComplianceSelectOptionsCatalog {
    return NON_COMPLIANCE_SELECT_OPTIONS;
  },

  async getNonComplianceAssets({
    search = '',
    status = 'ALL',
  }: { search?: string; status?: string } = {}): Promise<NonComplianceAssetsQueryResponse> {
    await delay(140);
    const q = search.trim().toLowerCase();

    const filtered = nonComplianceAssetsStore.filter((item) => {
      const matchesSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        (item.assetIdentification?.assetName || '').toLowerCase().includes(q) ||
        (item.assetIdentification?.serialNumber || '').toLowerCase().includes(q) ||
        (item.assetIdentification?.modelBrand || '').toLowerCase().includes(q) ||
        (item.assetIdentification?.assignedTo || '').toLowerCase().includes(q) ||
        (item.basicDetails?.customer || '').toLowerCase().includes(q) ||
        (item.financialOwnership?.vendorSupplier || '').toLowerCase().includes(q);

      const matchesStatus =
        status === 'ALL' || item.status.toLowerCase() === status.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    return {
      items: filtered,
      total: nonComplianceAssetsStore.length,
      draftCount: nonComplianceAssetsStore.filter((i) => i.status === 'Draft').length,
      activeCount: nonComplianceAssetsStore.filter((i) => i.status === 'Active').length,
    };
  },

  async getNonComplianceAssetById(assetId: string): Promise<NonComplianceAsset | null> {
    await delay(120);
    return nonComplianceAssetsStore.find((item) => item.id === assetId) || null;
  },

  /**
   * Save as Draft OR Submit a Non-Compliance Asset (creates or updates)
   */
  async saveNonComplianceAsset(
    payload: NonComplianceAssetSavePayload,
    {
      isDraft = false,
      existingId = null,
    }: { isDraft?: boolean; existingId?: string | null } = {}
  ): Promise<NonComplianceAsset> {
    await delay(180);

    const status: NonComplianceAssetStatus = isDraft ? 'Draft' : 'Active';
    const statusTone = resolveToneForStatus(status);
    const timestamp = '2026-10-01 10:45';

    const matchedEmployee = EMPLOYEE_DIRECTORY.find(
      (e) => e.name === payload.assetIdentification?.assignedTo
    );

    const formattedPurchaseVal = payload.financialOwnership?.purchaseValueSar
      ? payload.financialOwnership.purchaseValueSar.includes('SAR')
        ? payload.financialOwnership.purchaseValueSar
        : `${payload.financialOwnership.purchaseValueSar} SAR`
      : '4,500 SAR';

    const formattedUsefulLife = payload.financialOwnership?.usefulLifeYears
      ? payload.financialOwnership.usefulLifeYears.toLowerCase().includes('year')
        ? payload.financialOwnership.usefulLifeYears
        : `${payload.financialOwnership.usefulLifeYears} Years`
      : '3 Years';

    const normalizedPayload: NonComplianceAssetSavePayload = {
      ...payload,
      financialOwnership: {
        ...payload.financialOwnership,
        purchaseValueSar: formattedPurchaseVal,
        usefulLifeYears: formattedUsefulLife,
        currentBookValue:
          payload.financialOwnership?.currentBookValue || '3,200 SAR as of 2025',
      },
      warrantyDocument: {
        ...payload.warrantyDocument,
        validityDate:
          payload.warrantyDocument?.validityDate ||
          payload.warrantyDocument?.expiryDate ||
          '2028-01-14',
      },
    };

    let savedRecord: NonComplianceAsset | undefined;

    if (existingId) {
      const idx = nonComplianceAssetsStore.findIndex((item) => item.id === existingId);
      if (idx !== -1) {
        savedRecord = {
          ...nonComplianceAssetsStore[idx],
          ...normalizedPayload,
          companyName: normalizedPayload.basicDetails?.customer || 'Advanced Tech Co.',
          crNumber: nonComplianceAssetsStore[idx].crNumber || 'CR-1040123486',
          unifiedId: nonComplianceAssetsStore[idx].unifiedId || 'UNIFIED-7001928345',
          assignedRole:
            matchedEmployee?.role ||
            nonComplianceAssetsStore[idx].assignedRole ||
            'Assigned Custodian',
          department:
            matchedEmployee?.department ||
            normalizedPayload.basicDetails?.business ||
            'Enterprise IT & Digital Workplace',
          status,
          statusTone,
          updatedAt: timestamp,
        };
        nonComplianceAssetsStore[idx] = savedRecord;
      }
    }

    if (!savedRecord) {
      const randomNum = Math.floor(510 + Math.random() * 480);
      const code = `NCM-2026-0${randomNum}`;
      savedRecord = {
        id: code,
        code,
        companyName: normalizedPayload.basicDetails?.customer || 'Advanced Tech Co.',
        crNumber: 'CR-1040123486',
        unifiedId: 'UNIFIED-7001928345',
        assignedRole: matchedEmployee?.role || 'Assigned Custodian',
        department:
          matchedEmployee?.department ||
          normalizedPayload.basicDetails?.business ||
          'Enterprise IT & Digital Workplace',
        status,
        statusTone,
        updatedAt: timestamp,
        ...normalizedPayload,
      };
      nonComplianceAssetsStore.unshift(savedRecord);
    }

    // Synchronize with Main Assets Workspace store using the same stable ID
    const hasAssignee = Boolean(
      savedRecord.assetIdentification?.assignedTo &&
        savedRecord.assetIdentification.assignedTo.trim()
    );
    const mainStatus = isDraft ? 'Available' : hasAssignee ? 'Assigned' : 'Available';
    const mainAssetEntry: Asset = {
      id: savedRecord.id,
      code: savedRecord.code,
      name:
        savedRecord.assetIdentification?.assetName ||
        'Company Laptop - Dell Latitude 5440',
      category: savedRecord.basicDetails?.assetsCategory || 'Compliance',
      type: savedRecord.assetIdentification?.assetType || 'Laptop',
      classification: 'Non-Compliance',
      serialNumber: savedRecord.assetIdentification?.serialNumber || 'SN-123456789',
      status: mainStatus,
      statusTone: isDraft ? 'gold' : resolveToneForStatus(mainStatus),
      assignedTo: hasAssignee ? savedRecord.assetIdentification.assignedTo : null,
      assignedRole: hasAssignee ? savedRecord.assignedRole || 'Assigned Custodian' : null,
      department: savedRecord.department || 'Enterprise IT & Digital Workplace',
      location:
        savedRecord.financialOwnership?.assetLocation || 'Riyadh HQ - Floor 3',
      assignedDate: hasAssignee ? '2026-10-01' : null,
      updatedAt: timestamp,
      value: savedRecord.financialOwnership?.purchaseValueSar || '4,500 SAR',
      notes: isDraft
        ? 'Non-Compliance Asset saved as Draft.'
        : `${savedRecord.basicDetails?.assetsType || 'Non-Vehicle'} · ${savedRecord.assetIdentification?.modelBrand || 'Dell Latitude 5440'} · Vendor: ${savedRecord.financialOwnership?.vendorSupplier || 'Jarir Bookstore'} · Warranty: ${savedRecord.warrantyDocument?.documentName || 'MOT Test'} (${savedRecord.warrantyDocument?.uploadDocument || 'FitnessCard.pdf'}).`,
    };

    const mainIdx = assetsStore.findIndex((a) => a.id === savedRecord.id);
    if (mainIdx !== -1) {
      assetsStore[mainIdx] = mainAssetEntry;
    } else {
      assetsStore.unshift(mainAssetEntry);
    }

    return savedRecord;
  },

  /**
   * Explicit update method for an existing Non-Compliance Asset
   */
  async updateNonComplianceAsset(
    assetId: string,
    payload: NonComplianceAssetSavePayload,
    { isDraft = false }: { isDraft?: boolean } = {}
  ): Promise<NonComplianceAsset> {
    return this.saveNonComplianceAsset(payload, { isDraft, existingId: assetId });
  },

  /**
   * Reassign a Non-Compliance Asset to another employee and synchronize Main Assets workspace
   */
  async reassignNonComplianceAsset(
    assetId: string,
    {
      assignedTo,
      assignedRole,
      department,
      location,
    }: {
      assignedTo: string;
      assignedRole?: string;
      department?: string;
      location?: string;
    }
  ): Promise<NonComplianceAsset> {
    await delay(200);
    const idx = nonComplianceAssetsStore.findIndex((item) => item.id === assetId);
    if (idx === -1) {
      throw new Error(`Non-Compliance Asset ${assetId} not found`);
    }

    const matchedEmployee = EMPLOYEE_DIRECTORY.find((e) => e.name === assignedTo);
    const current = nonComplianceAssetsStore[idx];
    const nextLocation =
      location || matchedEmployee?.location || current.financialOwnership.assetLocation;
    const nextRole =
      assignedRole || matchedEmployee?.role || current.assignedRole || 'Assigned Custodian';
    const nextDepartment =
      department || matchedEmployee?.department || current.department || 'Enterprise IT';

    const updated: NonComplianceAsset = {
      ...current,
      assignedRole: nextRole,
      department: nextDepartment,
      updatedAt: '2026-10-01 10:48',
      assetIdentification: {
        ...current.assetIdentification,
        assignedTo,
      },
      financialOwnership: {
        ...current.financialOwnership,
        assetLocation: nextLocation,
      },
    };

    nonComplianceAssetsStore[idx] = updated;

    // Synchronize Main Assets Workspace store
    const mainIdx = assetsStore.findIndex((a) => a.id === assetId);
    if (mainIdx !== -1) {
      assetsStore[mainIdx] = {
        ...assetsStore[mainIdx],
        assignedTo: assignedTo || null,
        assignedRole: assignedTo ? nextRole : null,
        department: nextDepartment,
        location: nextLocation,
        status: assignedTo ? 'Assigned' : 'Available',
        statusTone: resolveToneForStatus(assignedTo ? 'Assigned' : 'Available'),
        assignedDate: assignedTo ? '2026-10-01' : null,
        updatedAt: '2026-10-01 10:48',
      };
    }

    return updated;
  },

  /**
   * Retire / Deactivate a Non-Compliance Asset and synchronize Main Assets workspace
   */
  async retireNonComplianceAsset(
    assetId: string,
    { reason = '' }: { reason?: string } = {}
  ): Promise<NonComplianceAsset> {
    await delay(200);
    const idx = nonComplianceAssetsStore.findIndex((item) => item.id === assetId);
    if (idx === -1) {
      throw new Error(`Non-Compliance Asset ${assetId} not found`);
    }

    const current = nonComplianceAssetsStore[idx];
    const updated: NonComplianceAsset = {
      ...current,
      status: 'Retired',
      statusTone: 'neutral',
      updatedAt: '2026-10-01 10:50',
      retirementReason: reason.trim() || 'Deactivated by user action.',
      financialOwnership: {
        ...current.financialOwnership,
        condition: 'Retired',
      },
    };
    nonComplianceAssetsStore[idx] = updated;

    // Synchronize Main Assets Workspace store
    const mainIdx = assetsStore.findIndex((a) => a.id === assetId);
    if (mainIdx !== -1) {
      assetsStore[mainIdx] = {
        ...assetsStore[mainIdx],
        status: 'Retired',
        statusTone: 'neutral',
        assignedTo: null,
        assignedRole: null,
        updatedAt: '2026-10-01 10:50',
      };
    }

    return updated;
  },

  // ==========================================================================
  // MASTER → ASSET CATEGORIES SERVICE METHODS (PHASE 4)
  // ==========================================================================

  generateNextCategoryId(): string {
    const existingNums = assetCategoriesStore
      .map((c) => {
        const match = c.categoryId.match(/^AC(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !Number.isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 5;
    const targetNum = Math.max(maxNum + 1, nextCategorySequence);
    return `AC${String(targetNum).padStart(3, '0')}`;
  },

  async getAssetCategories({
    search = '',
    page = 1,
    pageSize = 10,
  }: AssetCategoriesQueryParams = {}): Promise<AssetCategoriesQueryResponse> {
    await delay(140);
    const q = search.trim().toLowerCase();

    const filtered = assetCategoriesStore.filter((cat) => {
      if (!q) return true;
      return (
        cat.categoryId.toLowerCase().includes(q) ||
        cat.categoryName.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        cat.createdDate.toLowerCase().includes(q) ||
        cat.status.toLowerCase().includes(q)
      );
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      allMatchingItems: filtered,
      summaryTotalLabel: ASSET_CATEGORIES_SUMMARY_LABEL,
      totalRecordsCount: assetCategoriesStore.length,
      activeCount: assetCategoriesStore.filter((c) => c.status === 'Active').length,
      inactiveCount: assetCategoriesStore.filter((c) => c.status === 'Inactive').length,
      pagination: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  },

  async getAssetCategoryById(categoryId: string): Promise<AssetCategory | null> {
    await delay(100);
    return (
      assetCategoriesStore.find(
        (cat) => cat.categoryId.toLowerCase() === categoryId.toLowerCase()
      ) || null
    );
  },

  async createAssetCategory(
    payload: AssetCategoryCreatePayload
  ): Promise<AssetCategory> {
    await delay(180);
    const generatedId = payload.categoryId?.trim() || this.generateNextCategoryId();
    nextCategorySequence += 1;

    const newCategory: AssetCategory = {
      categoryId: generatedId,
      categoryName: payload.categoryName.trim(),
      description: payload.description.trim(),
      createdDate: '2026-10-01',
      status: 'Active',
      statusTone: 'success',
      language: payload.language || 'English',
    };

    assetCategoriesStore.unshift(newCategory);
    return newCategory;
  },

  async updateAssetCategory(
    categoryId: string,
    payload: AssetCategoryUpdatePayload
  ): Promise<AssetCategory> {
    await delay(180);
    const idx = assetCategoriesStore.findIndex(
      (cat) => cat.categoryId === categoryId
    );
    if (idx === -1) {
      throw new Error(`Asset Category ${categoryId} not found`);
    }

    const updated: AssetCategory = {
      ...assetCategoriesStore[idx],
      categoryName: payload.categoryName.trim(),
      description: payload.description.trim(),
      language: payload.language || assetCategoriesStore[idx].language || 'English',
    };

    assetCategoriesStore[idx] = updated;
    return updated;
  },

  async deactivateAssetCategory(categoryId: string): Promise<AssetCategory> {
    await delay(180);
    const idx = assetCategoriesStore.findIndex(
      (cat) => cat.categoryId === categoryId
    );
    if (idx === -1) {
      throw new Error(`Asset Category ${categoryId} not found`);
    }

    const updated: AssetCategory = {
      ...assetCategoriesStore[idx],
      status: 'Inactive',
      statusTone: 'neutral',
    };

    assetCategoriesStore[idx] = updated;
    return updated;
  },

  async deleteAssetCategory(categoryId: string): Promise<boolean> {
    await delay(180);
    const idx = assetCategoriesStore.findIndex(
      (cat) => cat.categoryId === categoryId
    );
    if (idx === -1) {
      throw new Error(`Asset Category ${categoryId} not found`);
    }

    assetCategoriesStore.splice(idx, 1);
    return true;
  },

  exportAssetCategoriesCsv(records: AssetCategory[] = assetCategoriesStore): string {
    const headers = [
      'Category ID',
      'Category Name',
      'Description',
      'Created Date',
      'Status',
    ];

    const escapeCsvCell = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((item) =>
      [
        item.categoryId,
        item.categoryName,
        item.description,
        item.createdDate,
        item.status,
      ]
        .map(escapeCsvCell)
        .join(',')
    );

    return [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  },

  // ==========================================================================
  // MASTER → ASSET TYPES SERVICE METHODS (PHASE 5)
  // ==========================================================================

  generateNextTypeId(): string {
    const existingNums = assetTypesStore
      .map((t) => {
        const match = t.typeId.match(/^AT-(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !Number.isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 5;
    const targetNum = Math.max(maxNum + 1, nextTypeSequence);
    return `AT-${String(targetNum).padStart(3, '0')}`;
  },

  async getCategorySelectOptions(): Promise<Array<{ value: string; label: string }>> {
    await delay(60);
    const categoryNamesFromStore = assetCategoriesStore.map((c) => c.categoryName);
    const categoryNamesFromTypes = assetTypesStore.map((t) => t.category);
    const unique = Array.from(new Set([...categoryNamesFromStore, ...categoryNamesFromTypes])).filter(Boolean);
    return unique.map((name) => ({ value: name, label: name }));
  },

  async getAssetTypes({
    search = '',
    page = 1,
    pageSize = 8,
  }: AssetTypesQueryParams = {}): Promise<AssetTypesQueryResponse> {
    await delay(140);
    const q = search.trim().toLowerCase();

    const filtered = assetTypesStore.filter((type) => {
      if (!q) return true;
      return (
        type.typeId.toLowerCase().includes(q) ||
        type.typeName.toLowerCase().includes(q) ||
        type.category.toLowerCase().includes(q) ||
        type.description.toLowerCase().includes(q) ||
        type.createdDate.toLowerCase().includes(q) ||
        type.status.toLowerCase().includes(q)
      );
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      allMatchingItems: filtered,
      summaryTotalLabel: ASSET_TYPES_SUMMARY_LABEL,
      totalRecordsCount: assetTypesStore.length,
      activeCount: assetTypesStore.filter((t) => t.status === 'Active').length,
      inactiveCount: assetTypesStore.filter((t) => t.status === 'Inactive').length,
      pagination: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  },

  async getAssetTypeById(typeId: string): Promise<AssetType | null> {
    await delay(100);
    return (
      assetTypesStore.find(
        (t) => t.typeId.toLowerCase() === typeId.toLowerCase()
      ) || null
    );
  },

  async createAssetType(
    payload: AssetTypeCreatePayload
  ): Promise<AssetType> {
    await delay(180);
    const generatedId = payload.typeId?.trim() || this.generateNextTypeId();
    nextTypeSequence += 1;

    const newType: AssetType = {
      typeId: generatedId,
      typeName: payload.typeName.trim(),
      category: payload.category.trim(),
      description: payload.description.trim(),
      createdDate: '2026-10-01',
      status: 'Active',
      statusTone: 'success',
      language: payload.language || 'English',
    };

    assetTypesStore.unshift(newType);
    return newType;
  },

  async updateAssetType(
    typeId: string,
    payload: AssetTypeUpdatePayload
  ): Promise<AssetType> {
    await delay(180);
    const idx = assetTypesStore.findIndex(
      (t) => t.typeId.toLowerCase() === typeId.toLowerCase()
    );
    if (idx === -1) {
      throw new Error(`Asset Type ${typeId} not found`);
    }

    const updated: AssetType = {
      ...assetTypesStore[idx],
      typeName: payload.typeName.trim(),
      category: payload.category.trim(),
      description: payload.description.trim(),
      language: payload.language || assetTypesStore[idx].language || 'English',
    };

    assetTypesStore[idx] = updated;
    return updated;
  },

  async deactivateAssetType(typeId: string): Promise<AssetType> {
    await delay(180);
    const idx = assetTypesStore.findIndex(
      (t) => t.typeId.toLowerCase() === typeId.toLowerCase()
    );
    if (idx === -1) {
      throw new Error(`Asset Type ${typeId} not found`);
    }

    const updated: AssetType = {
      ...assetTypesStore[idx],
      status: 'Inactive',
      statusTone: 'neutral',
    };

    assetTypesStore[idx] = updated;
    return updated;
  },

  async deleteAssetType(typeId: string): Promise<boolean> {
    await delay(180);
    const idx = assetTypesStore.findIndex(
      (t) => t.typeId.toLowerCase() === typeId.toLowerCase()
    );
    if (idx === -1) {
      throw new Error(`Asset Type ${typeId} not found`);
    }

    assetTypesStore.splice(idx, 1);
    return true;
  },

  exportAssetTypesCsv(records: AssetType[] = assetTypesStore): string {
    const headers = [
      'Type ID',
      'Type Name',
      'Category',
      'Description',
      'Created Date',
      'Status',
    ];

    const escapeCsvCell = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((item) =>
      [
        item.typeId,
        item.typeName,
        item.category,
        item.description,
        item.createdDate,
        item.status,
      ]
        .map(escapeCsvCell)
        .join(',')
    );

    return [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  },

  // ==========================================================================
  // MASTER → ASSET TAGS SERVICE METHODS (PHASE 6)
  // ==========================================================================

  generateNextTagId(): string {
    const existingNums = assetTagsStore
      .map((t) => {
        const match = t.tagId.match(/^TAG-(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !Number.isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 5;
    const targetNum = Math.max(maxNum + 1, nextTagSequence);
    return `TAG-${String(targetNum).padStart(3, '0')}`;
  },

  async getAssetTags({
    search = '',
    page = 1,
    pageSize = 8,
  }: AssetTagsQueryParams = {}): Promise<AssetTagsQueryResponse> {
    await delay(140);
    const q = search.trim().toLowerCase();

    const filtered = assetTagsStore.filter((tag) => {
      if (!q) return true;
      return (
        tag.tagId.toLowerCase().includes(q) ||
        tag.tagName.toLowerCase().includes(q) ||
        tag.description.toLowerCase().includes(q) ||
        tag.createdDate.toLowerCase().includes(q) ||
        tag.status.toLowerCase().includes(q)
      );
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      allMatchingItems: filtered,
      summaryTotalLabel: ASSET_TAGS_SUMMARY_LABEL,
      totalRecordsCount: assetTagsStore.length,
      activeCount: assetTagsStore.filter((t) => t.status === 'Active').length,
      inactiveCount: assetTagsStore.filter((t) => t.status === 'Inactive').length,
      pagination: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  },

  async getAssetTagById(tagId: string): Promise<AssetTag | null> {
    await delay(100);
    return (
      assetTagsStore.find(
        (t) => t.tagId.toLowerCase() === tagId.toLowerCase()
      ) || null
    );
  },

  async createAssetTag(payload: AssetTagCreatePayload): Promise<AssetTag> {
    await delay(180);
    const generatedId = payload.tagId?.trim() || this.generateNextTagId();
    nextTagSequence += 1;

    const newTag: AssetTag = {
      tagId: generatedId,
      tagName: payload.tagName.trim(),
      description: payload.description.trim(),
      createdDate: '2026-10-02',
      status: 'Active',
      statusTone: 'success',
      language: payload.language || 'English',
    };

    assetTagsStore.unshift(newTag);
    return newTag;
  },

  async updateAssetTag(
    tagId: string,
    payload: AssetTagUpdatePayload
  ): Promise<AssetTag> {
    await delay(180);
    const idx = assetTagsStore.findIndex(
      (t) => t.tagId.toLowerCase() === tagId.toLowerCase()
    );
    if (idx === -1) {
      throw new Error(`Asset Tag ${tagId} not found`);
    }

    const updated: AssetTag = {
      ...assetTagsStore[idx],
      tagName: payload.tagName.trim(),
      description: payload.description.trim(),
      language: payload.language || assetTagsStore[idx].language || 'English',
    };

    assetTagsStore[idx] = updated;
    return updated;
  },

  async deactivateAssetTag(tagId: string): Promise<AssetTag> {
    await delay(180);
    const idx = assetTagsStore.findIndex(
      (t) => t.tagId.toLowerCase() === tagId.toLowerCase()
    );
    if (idx === -1) {
      throw new Error(`Asset Tag ${tagId} not found`);
    }

    const updated: AssetTag = {
      ...assetTagsStore[idx],
      status: 'Inactive',
      statusTone: 'neutral',
    };

    assetTagsStore[idx] = updated;
    return updated;
  },

  async deleteAssetTag(tagId: string): Promise<boolean> {
    await delay(180);
    const idx = assetTagsStore.findIndex(
      (t) => t.tagId.toLowerCase() === tagId.toLowerCase()
    );
    if (idx === -1) {
      throw new Error(`Asset Tag ${tagId} not found`);
    }

    assetTagsStore.splice(idx, 1);
    return true;
  },

  exportAssetTagsCsv(records: AssetTag[] = assetTagsStore): string {
    const headers = [
      'Tag ID',
      'Tag Name',
      'Description',
      'Created Date',
      'Status',
    ];

    const escapeCsvCell = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((item) =>
      [
        item.tagId,
        item.tagName,
        item.description,
        item.createdDate,
        item.status,
      ]
        .map(escapeCsvCell)
        .join(',')
    );

    return [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  },

  // ==========================================================================
  // MASTER → ASSET STATUS SERVICE METHODS (PHASE 7)
  // ==========================================================================

  generateNextStatusCode(): string {
    const existingNums = assetStatusesStore
      .map((s) => {
        const match = s.statusCode.match(/^STATUS\s*(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !Number.isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 5;
    const targetNum = Math.max(maxNum + 1, nextStatusSequence);
    return `STATUS ${String(targetNum).padStart(2, '0')}`;
  },

  async getAssetStatuses({
    search = '',
    page = 1,
    pageSize = 8,
  }: AssetStatusesQueryParams = {}): Promise<AssetStatusesQueryResponse> {
    await delay(140);
    const q = search.trim().toLowerCase();

    const filtered = assetStatusesStore.filter((item) => {
      if (!q) return true;
      return (
        item.statusCode.toLowerCase().includes(q) ||
        item.statusName.toLowerCase().includes(q) ||
        item.authorName.toLowerCase().includes(q) ||
        item.authorEmail.toLowerCase().includes(q) ||
        item.createdDate.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      allMatchingItems: filtered,
      summaryTotalLabel: ASSET_STATUSES_SUMMARY_LABEL,
      totalRecordsCount: assetStatusesStore.length,
      activeCount: assetStatusesStore.filter((s) => s.status === 'Active').length,
      deactivatedCount: assetStatusesStore.filter((s) => s.status === 'Deactivated').length,
      pagination: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  },

  async getAssetStatusById(statusCode: string): Promise<AssetStatus | null> {
    await delay(100);
    return (
      assetStatusesStore.find(
        (s) => s.statusCode.toLowerCase() === statusCode.toLowerCase()
      ) || null
    );
  },

  async createAssetStatus(
    payload: AssetStatusCreatePayload
  ): Promise<AssetStatus> {
    await delay(180);
    const generatedCode = payload.statusCode?.trim() || this.generateNextStatusCode();
    nextStatusSequence += 1;

    const newStatus: AssetStatus = {
      statusCode: generatedCode,
      statusName: payload.statusName.trim(),
      description: payload.description?.trim() || '',
      authorName: payload.authorName || 'Ahmed Al Anazi',
      authorEmail: payload.authorEmail || 'ahmedalanzazi123@awn.com',
      createdDate: '22.02.2025',
      language: payload.language || 'English',
      status: 'Active',
      statusTone: 'success',
    };

    assetStatusesStore.unshift(newStatus);
    return newStatus;
  },

  async updateAssetStatus(
    statusCode: string,
    payload: AssetStatusUpdatePayload
  ): Promise<AssetStatus> {
    await delay(180);
    const idx = assetStatusesStore.findIndex(
      (s) => s.statusCode.toLowerCase() === statusCode.toLowerCase()
    );
    if (idx === -1) {
      throw new Error(`Asset Status ${statusCode} not found`);
    }

    const updated: AssetStatus = {
      ...assetStatusesStore[idx],
      statusName: payload.statusName.trim(),
      description: payload.description.trim(),
      language: payload.language || assetStatusesStore[idx].language || 'English',
    };

    assetStatusesStore[idx] = updated;
    return updated;
  },

  async deactivateAssetStatus(statusCode: string): Promise<AssetStatus> {
    await delay(180);
    const idx = assetStatusesStore.findIndex(
      (s) => s.statusCode.toLowerCase() === statusCode.toLowerCase()
    );
    if (idx === -1) {
      throw new Error(`Asset Status ${statusCode} not found`);
    }

    const updated: AssetStatus = {
      ...assetStatusesStore[idx],
      status: 'Deactivated',
      statusTone: 'neutral',
    };

    assetStatusesStore[idx] = updated;
    return updated;
  },

  async deleteAssetStatus(statusCode: string): Promise<boolean> {
    await delay(180);
    const idx = assetStatusesStore.findIndex(
      (s) => s.statusCode.toLowerCase() === statusCode.toLowerCase()
    );
    if (idx === -1) {
      throw new Error(`Asset Status ${statusCode} not found`);
    }

    assetStatusesStore.splice(idx, 1);
    return true;
  },

  exportAssetStatusesCsv(records: AssetStatus[] = assetStatusesStore): string {
    const headers = [
      'Status Code',
      'Tags Name',
      'Author/Creator',
      'Created Date',
      'Status',
    ];

    const escapeCsvCell = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((item) =>
      [
        item.statusCode,
        item.statusName,
        item.authorName,
        item.createdDate,
        item.status,
      ]
        .map(escapeCsvCell)
        .join(',')
    );

    return [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  },

  /**
   * Other module placeholder workspaces
   */
  async getWorkspaceData(
    workspaceId: string,
    { search = '', statusFilter = 'ALL', page = 1, pageSize = 5 }: SearchFilterParams = {}
  ): Promise<WorkspaceDataResponse> {
    await delay(160);
    const targetKey = memoryStore[workspaceId] ? workspaceId : 'dashboard';
    const workspace = memoryStore[targetKey];
    const allItems = workspace.items || [];

    const normalizedSearch = search.trim().toLowerCase();
    const filtered = allItems.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.code.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch) ||
        item.custodian.toLowerCase().includes(normalizedSearch) ||
        item.location.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'ALL' ||
        item.status.toLowerCase() === statusFilter.toLowerCase() ||
        item.statusTone === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return {
      workspaceId: targetKey,
      metrics: workspace.metrics || [],
      items: paginatedItems,
      pagination: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  },

  async resetWorkspaceData(workspaceId: string): Promise<boolean> {
    await delay(150);
    if (workspaceId === 'assets-group') {
      assetsStore = cloneDeep(INITIAL_ASSETS_LIST);
      complianceAssetsStore = cloneDeep(INITIAL_COMPLIANCE_ASSETS);
      nonComplianceAssetsStore = cloneDeep(INITIAL_NON_COMPLIANCE_ASSETS);
      assetTypesStore = cloneDeep(INITIAL_ASSET_TYPES);
      nextTypeSequence = 6;
      assetTagsStore = cloneDeep(INITIAL_ASSET_TAGS);
      nextTagSequence = 6;
      assetStatusesStore = cloneDeep(INITIAL_ASSET_STATUSES);
      nextStatusSequence = 6;
      return true;
    }
    if (workspaceId === 'asset-types') {
      assetTypesStore = cloneDeep(INITIAL_ASSET_TYPES);
      nextTypeSequence = 6;
      return true;
    }
    if (workspaceId === 'asset-tags') {
      assetTagsStore = cloneDeep(INITIAL_ASSET_TAGS);
      nextTagSequence = 6;
      return true;
    }
    if (workspaceId === 'asset-status') {
      assetStatusesStore = cloneDeep(INITIAL_ASSET_STATUSES);
      nextStatusSequence = 6;
      return true;
    }
    if (workspaceId === 'compliance-assets') {
      complianceAssetsStore = cloneDeep(INITIAL_COMPLIANCE_ASSETS);
      return true;
    }
    if (workspaceId === 'non-compliance-assets') {
      nonComplianceAssetsStore = cloneDeep(INITIAL_NON_COMPLIANCE_ASSETS);
      return true;
    }
    if (workspaceId && INITIAL_WORKSPACE_RECORDS[workspaceId]) {
      memoryStore[workspaceId] = cloneDeep(INITIAL_WORKSPACE_RECORDS[workspaceId]);
    }
    return true;
  },
};
