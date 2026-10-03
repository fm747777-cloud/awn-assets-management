import { z } from 'zod';

export const assetTagSchema = z.object({
  tagId: z.string(),
  language: z.string().default('English'),
  tagName: z.string().trim().min(1, 'Tag Name is required.'),
  description: z.string().optional().default(''),
});

export type AssetTagFormValues = z.infer<typeof assetTagSchema>;
