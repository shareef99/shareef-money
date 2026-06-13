import { z } from "zod";
import { categoryTypes } from "../types";

export const categoryCreateSchema = z
  .object({
    parentId: z.number().int().positive().nullable().default(null),
    name: z.string().min(1).max(100),
    type: z.enum(categoryTypes),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(),
  })
  .strict();
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

export const categoryUpdateSchema = z
  .object({
    parentId: z.number().int().positive().nullable().optional(),
    name: z.string().min(1).max(100).optional(),
    type: z.enum(categoryTypes).optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .nullable()
      .optional(),
    sortOrder: z.number().int().min(0).optional(),
    isArchived: z.boolean().optional(),
  })
  .strict();
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
