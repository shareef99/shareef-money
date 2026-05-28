import { z } from "zod";

export const locationCreateSchema = z
  .object({
    name: z.string().min(1).max(100),
  })
  .strict();
export type LocationCreateInput = z.infer<typeof locationCreateSchema>;

export const locationUpdateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    isArchived: z.boolean().optional(),
  })
  .strict();
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
