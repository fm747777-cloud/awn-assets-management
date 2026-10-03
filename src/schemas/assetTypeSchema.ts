import { z } from 'zod';

export const assetTypeSchema = z.object({
  typeId: z.string(),
  language: z.string().default('English'),
  typeName: z.string().trim().min(1, 'Type Name is required.'),
  category: z.string().trim().min(1, 'Category is required.'),
  description: z.string().optional().default(''),
});

export type AssetTypeFormValues = z.infer<typeof assetTypeSchema>;
