import { and, desc, eq } from "drizzle-orm";
import {
  smsImportsTable,
  merchantRulesTable,
  senderAccountsTable,
} from "@shareef-money/db/schema";
import {
  parseTransactionSms,
  computeSmsHash,
} from "@shareef-money/shared/sms";
import { getSmsMessages } from "../../modules/sms-reader";
import type { Db } from "../db/client";
import { generateSyncId } from "../lib/sync-id";
import { getSetting, setSetting } from "./settings-service";
import { createTransaction } from "./transaction-service";
import { SETTING_KEYS } from "../queries/use-settings";

// How far back the very first scan looks. Later scans are incremental from the
// last-seen message (with a day of overlap for clock skew).
const FIRST_SCAN_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;
const RESCAN_OVERLAP_MS = 24 * 60 * 60 * 1000;
const SCAN_LIMIT = 3000;

export type SmsImportStatus = "pending" | "imported" | "dismissed";

/** Uppercased, whitespace-collapsed key for merchant-rule lookups. */
export function normalizeMerchant(name: string): string {
  return name.toUpperCase().replace(/\s+/g, " ").trim();
}

export async function getSmsImports(
  db: Db,
  userId: string,
  status: SmsImportStatus,
) {
  return db.query.smsImportsTable.findMany({
    where: and(
      eq(smsImportsTable.userId, userId),
      eq(smsImportsTable.status, status),
    ),
    orderBy: desc(smsImportsTable.receivedAt),
    with: { transaction: true },
  });
}

export async function getSmsImportById(db: Db, userId: string, id: number) {
  return db.query.smsImportsTable.findFirst({
    where: and(eq(smsImportsTable.id, id), eq(smsImportsTable.userId, userId)),
  });
}

export async function getPendingSmsCount(db: Db, userId: string) {
  const rows = await db.query.smsImportsTable.findMany({
    where: and(
      eq(smsImportsTable.userId, userId),
      eq(smsImportsTable.status, "pending"),
    ),
    columns: { id: true },
  });
  return rows.length;
}

/**
 * Reads new inbox messages, parses them, and stores every detected transaction
 * as a pending sms_import. Dedupe is by (userId, smsHash), so rescans and the
 * overlap window never duplicate. Returns how many new rows were stored.
 */
export async function scanSms(
  db: Db,
  userId: string,
  opts: { fullRescan?: boolean } = {},
): Promise<{ scanned: number; found: number }> {
  const lastRaw = await getSetting(db, userId, SETTING_KEYS.smsLastScanMs);
  const last = Number(lastRaw);
  const since =
    opts.fullRescan || !Number.isFinite(last) || last <= 0
      ? Date.now() - FIRST_SCAN_WINDOW_MS
      : last - RESCAN_OVERLAP_MS;

  const messages = await getSmsMessages({ sinceMs: since, limit: SCAN_LIMIT });

  let found = 0;
  let newest = Number.isFinite(last) ? last : 0;
  for (const msg of messages) {
    if (msg.date > newest) newest = msg.date;
    const parsed = parseTransactionSms({ sender: msg.address, body: msg.body });
    if (!parsed) continue;
    const smsHash = computeSmsHash(msg.address, msg.body, msg.date);
    const inserted = await db
      .insert(smsImportsTable)
      .values({
        id: generateSyncId(),
        userId,
        smsHash,
        sender: msg.address,
        body: msg.body,
        receivedAt: new Date(msg.date),
        amount: parsed.amount,
        type: parsed.type,
        accountLast4: parsed.accountLast4,
        bankCode: parsed.bankCode,
        counterparty: parsed.counterparty,
        refNo: parsed.refNo,
      })
      .onConflictDoNothing({
        target: [smsImportsTable.userId, smsImportsTable.smsHash],
      })
      .returning({ id: smsImportsTable.id });
    if (inserted.length > 0) found += 1;
  }

  if (newest > 0) {
    await setSetting(db, userId, SETTING_KEYS.smsLastScanMs, String(newest));
  }
  return { scanned: messages.length, found };
}

/** The account previously chosen for this bank (+ account tail), if any. */
export async function findAccountForSender(
  db: Db,
  userId: string,
  bankCode: string | null,
  accountLast4: string | null,
): Promise<number | null> {
  if (!bankCode) return null;
  const exact = accountLast4
    ? await db.query.senderAccountsTable.findFirst({
        where: and(
          eq(senderAccountsTable.userId, userId),
          eq(senderAccountsTable.bankCode, bankCode),
          eq(senderAccountsTable.accountLast4, accountLast4),
        ),
      })
    : undefined;
  if (exact) return exact.accountId;
  const bankWide = await db.query.senderAccountsTable.findFirst({
    where: and(
      eq(senderAccountsTable.userId, userId),
      eq(senderAccountsTable.bankCode, bankCode),
      eq(senderAccountsTable.accountLast4, ""),
    ),
  });
  return bankWide?.accountId ?? null;
}

export async function findMerchantRule(
  db: Db,
  userId: string,
  counterparty: string | null,
) {
  if (!counterparty) return null;
  const rule = await db.query.merchantRulesTable.findFirst({
    where: and(
      eq(merchantRulesTable.userId, userId),
      eq(merchantRulesTable.merchant, normalizeMerchant(counterparty)),
    ),
  });
  return rule ?? null;
}

/**
 * Remembers what the user picked while importing, so the next SMS from the
 * same merchant/bank needs no thought: merchant → category(+location), and
 * bank(+tail) → account.
 */
export async function rememberImportChoices(
  db: Db,
  userId: string,
  choices: {
    counterparty: string | null;
    categoryId: number | null;
    locationId: number | null;
    bankCode: string | null;
    accountLast4: string | null;
    accountId: number;
  },
) {
  if (choices.counterparty && choices.categoryId != null) {
    await db
      .insert(merchantRulesTable)
      .values({
        id: generateSyncId(),
        userId,
        merchant: normalizeMerchant(choices.counterparty),
        categoryId: choices.categoryId,
        locationId: choices.locationId,
      })
      .onConflictDoUpdate({
        target: [merchantRulesTable.userId, merchantRulesTable.merchant],
        set: {
          categoryId: choices.categoryId,
          locationId: choices.locationId,
          updatedAt: new Date(),
        },
      });
  }
  if (choices.bankCode) {
    await db
      .insert(senderAccountsTable)
      .values({
        id: generateSyncId(),
        userId,
        bankCode: choices.bankCode,
        accountLast4: choices.accountLast4 ?? "",
        accountId: choices.accountId,
      })
      .onConflictDoUpdate({
        target: [
          senderAccountsTable.userId,
          senderAccountsTable.bankCode,
          senderAccountsTable.accountLast4,
        ],
        set: { accountId: choices.accountId, updatedAt: new Date() },
      });
  }
}

/** Links a pending sms_import to the transaction created from it. */
export async function markSmsImported(
  db: Db,
  userId: string,
  smsImportId: number,
  transactionId: number,
) {
  await db
    .update(smsImportsTable)
    .set({ status: "imported", transactionId, updatedAt: new Date() })
    .where(
      and(
        eq(smsImportsTable.id, smsImportId),
        eq(smsImportsTable.userId, userId),
      ),
    );
}

export async function setSmsStatus(
  db: Db,
  userId: string,
  smsImportId: number,
  status: Exclude<SmsImportStatus, "imported">,
) {
  await db
    .update(smsImportsTable)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(smsImportsTable.id, smsImportId),
        eq(smsImportsTable.userId, userId),
      ),
    );
}

/**
 * Auto-import: pending messages whose bank maps to a known account AND whose
 * merchant has a remembered category become transactions with no review. The
 * rest stay pending — category is always required, so unknown merchants need
 * one manual pass (which teaches the rule for next time).
 */
export async function autoImportPending(
  db: Db,
  userId: string,
): Promise<number> {
  const pending = await getSmsImports(db, userId, "pending");
  let imported = 0;
  for (const sms of pending) {
    const accountId = await findAccountForSender(
      db,
      userId,
      sms.bankCode,
      sms.accountLast4,
    );
    if (accountId == null) continue;
    const rule = await findMerchantRule(db, userId, sms.counterparty);
    if (!rule) continue;
    const tx = await createTransaction(db, userId, {
      type: sms.type,
      amount: sms.amount,
      categoryId: rule.categoryId,
      accountId,
      locationId: rule.locationId,
      note: sms.counterparty,
      date: sms.receivedAt.getTime(),
    });
    if (tx) {
      await markSmsImported(db, userId, sms.id, tx.id);
      imported += 1;
    }
  }
  return imported;
}
