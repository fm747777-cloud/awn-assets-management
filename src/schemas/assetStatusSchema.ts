import { z } from 'zod';

export const assetStatusSchema = z.object({
  statusCode: z.string(),
  language: z.string().default('English'),
  statusName: z.string().trim().min(1, 'Status Name is required.'),
  description: z.string().optional().default(''),
});

export type AssetStatusFormValues = z.infer<typeof assetStatusSchema>;
