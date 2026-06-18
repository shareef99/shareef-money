import { and, eq, isNull } from "drizzle-orm";
import {
  recurringRulesTable,
  transactionsTable,
  transactionContactsTable,
} from "@shareef-money/db/schema";
import type { Db } from "../db/client";
import { generateSyncId } from "../lib/sync-id";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

// Advance a date by `interval` units of `frequency`. Month/year arithmetic uses
// the Date setters, so e.g. monthly from Jan 31 lands on the platform's rolled
// date — good enough for recurring bills.
export function advanceDate(date: Date, frequency: Frequency, interval: number): Date {
  const d = new Date(date);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + interval);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7 * interval);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + interval);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + interval);
      break;
  }
  return d;
}

type CreateRulePayload = {
  transactionId: number;
  frequency: Frequency;
  interval?: number;
  startDate: Date;
  endDate?: Date | null;
};

export async function createRecurringRule(
  db: Db,
  userId: string,
  payload: CreateRulePayload,
) {
  const interval = payload.interval ?? 1;
  const [rule] = await db
    .insert(recurringRulesTable)
    .values({
      id: generateSyncId(),
      userId,
      transactionId: payload.transactionId,
      frequency: payload.frequency,
      interval,
      startDate: payload.startDate,
      endDate: payload.endDate ?? null,
      // First materialized occurrence is the one AFTER the template itself.
      nextOccurrence: advanceDate(payload.startDate, payload.frequency, interval),
      isActive: true,
    })
    .returning();
  return rule;
}

export async function getRecurringRules(db: Db, userId: string) {
  return db.query.recurringRulesTable.findMany({
    where: and(
      eq(recurringRulesTable.userId, userId),
      isNull(recurringRulesTable.deletedAt),
    ),
    with: {
      transaction: {
        with: { category: true, account: true },
      },
    },
  });
}

export async function setRecurringActive(
  db: Db,
  userId: string,
  id: number,
  isActive: boolean,
) {
  await db
    .update(recurringRulesTable)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(recurringRulesTable.id, id), eq(recurringRulesTable.userId, userId)));
}

// Soft delete so the removal syncs (see transaction-service.deleteTransaction).
export async function deleteRecurringRule(db: Db, userId: string, id: number) {
  await db
    .update(recurringRulesTable)
    .set({ deletedAt: Date.now(), updatedAt: new Date() })
    .where(and(eq(recurringRulesTable.id, id), eq(recurringRulesTable.userId, userId)));
}

const MAX_CATCHUP = 500;

// Generate any transactions that have come due since the app last ran. Clones
// the template transaction (the one the rule was created from) for each missed
// occurrence, then advances/deactivates the rule. Returns how many were created.
export async function materializeDueRecurring(
  db: Db,
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  const rules = await db.query.recurringRulesTable.findMany({
    where: and(
      eq(recurringRulesTable.userId, userId),
      eq(recurringRulesTable.isActive, true),
      isNull(recurringRulesTable.deletedAt),
    ),
    with: {
      transaction: { with: { transactionContacts: true } },
    },
  });

  let created = 0;

  for (const rule of rules) {
    const template = rule.transaction;
    if (!template) {
      await setRecurringActive(db, userId, rule.id, false);
      continue;
    }

    let next = rule.nextOccurrence;
    const endDate = rule.endDate ?? null;
    let active = true;
    let guard = 0;

    while (next <= now && guard < MAX_CATCHUP) {
      if (endDate && next > endDate) {
        active = false;
        break;
      }

      const [clone] = await db
        .insert(transactionsTable)
        .values({
          id: generateSyncId(),
          userId,
          type: template.type,
          amount: template.amount,
          fee: template.fee,
          categoryId: template.categoryId,
          accountId: template.accountId,
          toAccountId: template.toAccountId,
          locationId: template.locationId,
          note: template.note,
          date: new Date(next),
        })
        .returning();

      if (clone) {
        for (const tc of template.transactionContacts ?? []) {
          await db
            .insert(transactionContactsTable)
            .values({ transactionId: clone.id, contactId: tc.contactId });
        }
        created += 1;
      }

      next = advanceDate(next, rule.frequency as Frequency, rule.interval);
      guard += 1;
    }

    if (endDate && next > endDate) active = false;

    await db
      .update(recurringRulesTable)
      .set({ nextOccurrence: next, isActive: active, updatedAt: new Date() })
      .where(eq(recurringRulesTable.id, rule.id));
  }

  return created;
}
