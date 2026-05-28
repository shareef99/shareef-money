import { z } from "zod";
import { transactionTypes } from "../types.js";

const tagsFields = {
  locationId: z.number().int().positive().nullable().optional(),
  contactIds: z.array(z.number().int().positive()).optional(),
};

const baseFields = {
  amount: z.number().int().positive(),
  note: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  date: z.number().int().positive(),
  ...tagsFields,
};

const incomeExpenseFields = {
  ...baseFields,
  categoryId: z.number().int().positive(),
  accountId: z.number().int().positive(),
};

const incomeSchema = z
  .object({
    type: z.literal("income"),
    ...incomeExpenseFields,
  })
  .strict();

const expenseSchema = z
  .object({
    type: z.literal("expense"),
    ...incomeExpenseFields,
  })
  .strict();

const transferSchema = z
  .object({
    type: z.literal("transfer"),
    ...baseFields,
    fee: z.number().int().min(0).default(0),
    accountId: z.number().int().positive(),
    toAccountId: z.number().int().positive(),
  })
  .strict();

export const transactionCreateSchema = z.discriminatedUnion("type", [
  incomeSchema,
  expenseSchema,
  transferSchema,
]);
export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;

export const transactionUpdateSchema = z
  .object({
    type: z.enum(transactionTypes).optional(),
    amount: z.number().int().positive().optional(),
    fee: z.number().int().min(0).optional(),
    categoryId: z.number().int().positive().nullable().optional(),
    accountId: z.number().int().positive().optional(),
    toAccountId: z.number().int().positive().nullable().optional(),
    locationId: z.number().int().positive().nullable().optional(),
    contactIds: z.array(z.number().int().positive()).optional(),
    note: z.string().max(200).nullable().optional(),
    description: z.string().max(1000).nullable().optional(),
    date: z.number().int().positive().optional(),
  })
  .strict();
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;

export const transactionFiltersSchema = z
  .object({
    type: z.enum(transactionTypes).optional(),
    categoryIds: z.array(z.number().int().positive()).optional(),
    accountIds: z.array(z.number().int().positive()).optional(),
    contactIds: z.array(z.number().int().positive()).optional(),
    locationIds: z.array(z.number().int().positive()).optional(),
    dateFrom: z.number().int().positive().optional(),
    dateTo: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(500).default(100),
    offset: z.number().int().min(0).default(0),
  })
  .strict();
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
