import { z } from 'zod';

export const complianceAssetFormSchema = z.object({
  basicDetails: z.object({
    language: z.string().default('Bilingual (EN / AR)'),
    customer: z.string().trim().min(1, 'Customer is required.'),
    business: z.string().trim().min(1, 'Business unit is required.'),
    assetsCategory: z.string().trim().min(1, 'Assets Category is required.'),
    compliance: z.string().default('TGA & Traffic Statutory Compliance'),
    assetsType: z.string().trim().min(1, 'Assets type is required.'),
  }),
  vehicleInfo: z.object({
    language: z.string().default('Bilingual (EN / AR)'),
    plateNumberEn: z.string().trim().min(1, 'Plate Number (English) is required.'),
    plateNumberAr: z.string().trim().min(1, 'Plate Number (Arabic) is required.'),
    ownerName: z.string().trim().min(1, 'Owner Name is required.'),
    ownerId: z.string().trim().min(1, 'Owner ID is required.'),
    serialNumber: z.string().trim().min(1, 'Serial Number is required.'),
    vinNumber: z.string().trim().min(1, 'VIN Number is required.'),
  }),
  driverInfo: z.object({
    language: z.string().default('Bilingual (EN / AR)'),
    driverId: z.string().optional().default(''),
    driverName: z.string().optional().default(''),
    driverLicenseCopy: z.string().optional().default(''),
    licenseIssueDate: z.string().optional().default(''),
    licenseExpiryDate: z.string().optional().default(''),
    licenseRenewalDate: z.string().optional().default(''),
  }),
  documentsInfo: z.object({
    template: z.string().default('Custom Document Selection'),
  }),
  registrationDetails: z.object({
    registrationType: z.string().default('Commercial Transport (نقل عام)'),
    vehicleCategory: z.string().default('Heavy Truck (شاحنة ثقيلة)'),
    brand: z.string().optional().default(''),
    color: z.string().optional().default(''),
    registrationIssueDate: z.string().optional().default(''),
    registrationValidityDate: z.string().optional().default(''),
    manufacturingYear: z.string().default('2026'),
    registrationCopy: z.string().optional().default(''),
  }),
  fitnessDetails: z.object({
    fitnessName: z.string().optional().default(''),
    fitnessNumber: z.string().optional().default(''),
    fitnessValidityDate: z.string().optional().default(''),
    expiryDate: z.string().optional().default(''),
    renewalDate: z.string().optional().default(''),
    fitnessDocumentCopy: z.string().optional().default(''),
  }),
  insuranceInfo: z.object({
    policyName: z.string().optional().default(''),
    insurancePolicyNumber: z.string().optional().default(''),
    insuranceType: z.string().default('Comprehensive Commercial Fleet'),
    insuranceIssue: z.string().optional().default(''),
    insuranceValidity: z.string().optional().default(''),
    renewalDate: z.string().optional().default(''),
    operationsCardCopy: z.string().optional().default(''),
  }),
  operationsCardInfo: z.object({
    cardName: z.string().optional().default(''),
    cardNumber: z.string().optional().default(''),
    issueDate: z.string().optional().default(''),
    expiryDate: z.string().optional().default(''),
    renewalDate: z.string().optional().default(''),
    operationsCardCopy: z.string().optional().default(''),
  }),
});

export type ComplianceAssetFormValues = z.infer<typeof complianceAssetFormSchema>;
