import { z } from "zod";
import { transactionTypes } from "../types";

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

// Debt events: money moves between one account and a person (contactId). No
// category, no toAccount, no fee. "debt_lend" = you gave; "debt_borrow" = you
// got. Per-person running balance is derived from these.
const debtFields = {
  ...baseFields,
  accountId: z.number().int().positive(),
  contactId: z.number().int().positive(),
  dueDate: z.number().int().positive().nullable().optional(),
};

const debtLendSchema = z
  .object({ type: z.literal("debt_lend"), ...debtFields })
  .strict();

const debtBorrowSchema = z
  .object({ type: z.literal("debt_borrow"), ...debtFields })
  .strict();

export const transactionCreateSchema = z.discriminatedUnion("type", [
  incomeSchema,
  expenseSchema,
  transferSchema,
  debtLendSchema,
  debtBorrowSchema,
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
    contactId: z.number().int().positive().nullable().optional(),
    dueDate: z.number().int().positive().nullable().optional(),
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
