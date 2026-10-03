import { z } from 'zod';

export const assetCategorySchema = z.object({
  categoryId: z.string(),
  language: z.string().default('English'),
  categoryName: z.string().trim().min(1, 'Category Name is required.'),
  description: z.string().optional().default(''),
});

export type AssetCategoryFormValues = z.infer<typeof assetCategorySchema>;
