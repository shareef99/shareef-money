import { z } from "zod";

export const contactCreateSchema = z
  .object({
    name: z.string().min(1).max(100),
  })
  .strict();
export type ContactCreateInput = z.infer<typeof contactCreateSchema>;

export const contactUpdateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    isArchived: z.boolean().optional(),
  })
  .strict();
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
