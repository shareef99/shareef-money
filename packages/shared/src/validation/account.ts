import { z } from "zod";

export const accountCreateSchema = z
  .object({
    name: z.string().min(1).max(100),
    initialBalance: z.number().int().default(0),
    description: z.string().max(500).optional(),
    icon: z.string().max(50).optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(),
  })
  .strict();
export type AccountCreateInput = z.infer<typeof accountCreateSchema>;

export const accountUpdateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    initialBalance: z.number().int().optional(),
    description: z.string().max(500).nullable().optional(),
    icon: z.string().max(50).nullable().optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .nullable()
      .optional(),
    sortOrder: z.number().int().min(0).optional(),
    isHidden: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .strict();
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
