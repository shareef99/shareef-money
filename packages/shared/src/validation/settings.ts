import { z } from "zod";
import {
  weekDays,
  themes,
  startScreens,
  inputOrders,
  swipeActions,
} from "../types";

const tagsRequiredPerTypeSchema = z
  .object({
    income: z.boolean(),
    expense: z.boolean(),
    transfer: z.boolean(),
  })
  .strict();

export const settingsUpdateSchema = z
  .object({
    currency_symbol: z.string().min(1).max(5).optional(),
    currency_code: z.string().length(3).optional(),
    start_screen: z.enum(startScreens).optional(),
    monthly_start_date: z.number().int().min(1).max(28).optional(),
    weekly_start_day: z.enum(weekDays).optional(),
    carry_over: z.boolean().optional(),
    passcode: z.string().min(4).max(6).nullable().optional(),
    passcode_enabled: z.boolean().optional(),
    alarm_enabled: z.boolean().optional(),
    alarm_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),
    show_description: z.boolean().optional(),
    autocomplete: z.boolean().optional(),
    input_order: z.enum(inputOrders).optional(),
    subcategory_enabled: z.boolean().optional(),
    swipe_action: z.enum(swipeActions).optional(),
    theme: z.enum(themes).optional(),
    contacts_enabled: z.boolean().optional(),
    contacts_required: tagsRequiredPerTypeSchema.optional(),
    locations_enabled: z.boolean().optional(),
    locations_required: tagsRequiredPerTypeSchema.optional(),
  })
  .strict();
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
