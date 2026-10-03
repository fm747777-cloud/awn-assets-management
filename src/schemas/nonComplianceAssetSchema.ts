import { z } from 'zod';

export const nonComplianceAssetFormSchema = z.object({
  basicDetails: z.object({
    language: z.string().default('English'),
    customer: z.string().default('Advanced Tech Co.'),
    business: z.string().default('Enterprise IT & Digital Workplace'),
    assetsCategory: z.string().default('Compliance'),
    compliance: z.string().default('Non-Compliance'),
    assetsType: z.string().trim().min(1, 'Assets type is required.'),
  }),
  assetIdentification: z.object({
    language: z.string().default('English'),
    assetName: z.string().trim().min(1, 'Asset Name is required.'),
    serialNumber: z.string().trim().min(1, 'Serial Number is required.'),
    modelBrand: z.string().optional().default(''),
    assetType: z.string().default('Owned'),
    purchaseDate: z.string().optional().default(''),
    warrantyExpiry: z.string().optional().default(''),
    assignedTo: z.string().default('Tariq Al-Mansoor'),
  }),
  documentsInfo: z.object({
    template: z.string().default('Standard IT & Financial Custody Template (Financial & Warranty)'),
  }),
  financialOwnership: z.object({
    purchaseValueSar: z.string().optional().default(''),
    vendorSupplier: z.string().optional().default(''),
    assetLocation: z.string().default('Riyadh HQ - Floor 3'),
    condition: z.string().default('Good'),
    usefulLifeYears: z.string().optional().default(''),
    depreciationMethod: z.string().default('Straight Line'),
    currentBookValue: z.string().default('3,200 SAR as of 2025'),
  }),
  warrantyDocument: z.object({
    documentName: z.string().optional().default(''),
    documentNumber: z.string().optional().default(''),
    issueDate: z.string().optional().default(''),
    renewalDate: z.string().optional().default(''),
    expiryDate: z.string().optional().default(''),
    validityDate: z.string().optional().default(''),
    uploadDocument: z.string().optional().default(''),
  }),
});

export type NonComplianceAssetFormValues = z.infer<typeof nonComplianceAssetFormSchema>;
