import { eq } from "drizzle-orm";
import {
  accountsTable,
  categoriesTable,
  contactsTable,
  locationsTable,
  transactionsTable,
  transactionContactsTable,
  recurringRulesTable,
  settingsTable,
} from "@shareef-money/db/schema";
import type { Db } from "../db/client";

// Bump if the on-disk shape changes incompatibly.
export const BACKUP_VERSION = 1;

type Row = Record<string, unknown>;

export type BackupData = {
  app: "shareef-money";
  version: number;
  exportedAt: number;
  data: {
    accounts: Row[];
    categories: Row[];
    contacts: Row[];
    locations: Row[];
    transactions: Row[];
    transactionContacts: Row[];
    recurringRules: Row[];
    settings: Row[];
  };
};

// Date columns per table, used to convert between Date objects (sqlite/drizzle)
// and the millisecond numbers stored in the JSON backup.
const DATE_FIELDS = {
  accounts: ["createdAt", "updatedAt"],
  categories: ["createdAt", "updatedAt"],
  contacts: ["createdAt", "updatedAt"],
  locations: ["createdAt", "updatedAt"],
  transactions: ["date", "createdAt", "updatedAt"],
  recurringRules: [
    "startDate",
    "endDate",
    "nextOccurrence",
    "createdAt",
    "updatedAt",
  ],
} as const;

function serialize(rows: Row[]): Row[] {
  return rows.map((r) => {
    const out: Row = {};
    for (const k in r) {
      const v = r[k];
      out[k] = v instanceof Date ? v.getTime() : v;
    }
    return out;
  });
}

// The local DB only ever holds the signed-in user's rows, but we still scope
// reads by userId for correctness. Cast like sync-service does to keep the
// generic drizzle table types from fighting a shared helper.
function byUser(db: Db, table: typeof accountsTable, userId: string): Row[] {
  return db
    .select()
    .from(table)
    .where(eq(table.userId, userId))
    .all() as Row[];
}

/** Reads every table for the user into a JSON-safe backup object. */
export function exportAll(db: Db, userId: string): BackupData {
  return {
    app: "shareef-money",
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    data: {
      accounts: serialize(byUser(db, accountsTable, userId)),
      categories: serialize(byUser(db, categoriesTable as never, userId)),
      contacts: serialize(byUser(db, contactsTable as never, userId)),
      locations: serialize(byUser(db, locationsTable as never, userId)),
      transactions: serialize(byUser(db, transactionsTable as never, userId)),
      // No userId column; the local DB only ever holds the signed-in user.
      transactionContacts: serialize(
        db.select().from(transactionContactsTable).all() as Row[],
      ),
      recurringRules: serialize(byUser(db, recurringRulesTable as never, userId)),
      settings: serialize(byUser(db, settingsTable as never, userId)),
    },
  };
}

function isRow(v: unknown): v is Row {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

// Every element of `arr` is an object carrying each required field with the
// expected primitive type. A missing array is treated as empty (valid).
function validRows(
  arr: unknown,
  required: { key: string; type: "number" | "string" }[],
): boolean {
  if (arr === undefined) return true;
  if (!Array.isArray(arr)) return false;
  return arr.every(
    (r) => isRow(r) && required.every(({ key, type }) => typeof r[key] === type),
  );
}

/**
 * Validates a parsed object is a Shareef Money backup we can restore. This runs
 * BEFORE the destructive restore, and now checks the shape of the rows we
 * actually insert (not just that the arrays exist) — a malformed file must be
 * rejected up front so it can't wipe the user's data and then half-load garbage.
 */
export function isValidBackup(obj: unknown): obj is BackupData {
  if (!obj || typeof obj !== "object") return false;
  const b = obj as Partial<BackupData>;
  if (b.app !== "shareef-money") return false;
  if (typeof b.version !== "number" || b.version > BACKUP_VERSION) return false;
  const d = b.data;
  if (!d || typeof d !== "object") return false;

  // The two anchor tables must be present arrays.
  if (!Array.isArray(d.transactions) || !Array.isArray(d.accounts)) return false;

  // Required, correctly-typed fields for each table we insert.
  return (
    validRows(d.accounts, [
      { key: "id", type: "number" },
      { key: "name", type: "string" },
    ]) &&
    validRows(d.transactions, [
      { key: "id", type: "number" },
      { key: "type", type: "string" },
      { key: "amount", type: "number" },
      { key: "accountId", type: "number" },
      { key: "date", type: "number" },
    ]) &&
    validRows(d.transactionContacts, [
      { key: "transactionId", type: "number" },
      { key: "contactId", type: "number" },
    ]) &&
    validRows(d.settings, [
      { key: "key", type: "string" },
      { key: "value", type: "string" },
    ])
  );
}

// `tx` is drizzle's transaction handle; typed loosely so the per-table casts
// below don't fight the generic table types.
type Tx = {
  insert: (table: unknown) => { values: (v: Row) => { run: () => void } };
};

function insertRows(
  tx: Tx,
  table: typeof accountsTable,
  rows: Row[] | undefined,
  dateFields: readonly string[],
  userId: string,
) {
  for (const row of rows ?? []) {
    const v: Row = { ...row, userId };
    for (const f of dateFields) {
      if (v[f] != null) v[f] = new Date(v[f] as number);
    }
    tx.insert(table).values(v).run();
  }
}

/**
 * Replaces ALL of the user's local data with the backup's contents. Wraps the
 * wipe + insert in a transaction so a failure leaves the DB untouched. The
 * userId is forced to the current user so a backup from another account still
 * loads. Caller is responsible for warning the user first.
 */
export function importAll(db: Db, userId: string, backup: BackupData) {
  // Defence in depth: never run the wipe on data that wouldn't pass validation,
  // even if a caller skipped isValidBackup.
  if (!isValidBackup(backup)) {
    throw new Error("Invalid backup file");
  }
  const d = backup.data;

  db.transaction((tx) => {
    const t = tx as unknown as Tx;
    // Wipe in dependency order (children first) in case FKs are enforced.
    tx.delete(transactionContactsTable).run();
    tx.delete(recurringRulesTable).where(eq(recurringRulesTable.userId, userId)).run();
    tx.delete(transactionsTable).where(eq(transactionsTable.userId, userId)).run();
    tx.delete(accountsTable).where(eq(accountsTable.userId, userId)).run();
    tx.delete(categoriesTable).where(eq(categoriesTable.userId, userId)).run();
    tx.delete(contactsTable).where(eq(contactsTable.userId, userId)).run();
    tx.delete(locationsTable).where(eq(locationsTable.userId, userId)).run();
    tx.delete(settingsTable).where(eq(settingsTable.userId, userId)).run();

    // Insert parents before children so foreign keys resolve.
    insertRows(t, accountsTable, d.accounts, DATE_FIELDS.accounts, userId);
    insertRows(t, categoriesTable as never, d.categories, DATE_FIELDS.categories, userId);
    insertRows(t, contactsTable as never, d.contacts, DATE_FIELDS.contacts, userId);
    insertRows(t, locationsTable as never, d.locations, DATE_FIELDS.locations, userId);
    insertRows(t, transactionsTable as never, d.transactions, DATE_FIELDS.transactions, userId);
    insertRows(
      t,
      recurringRulesTable as never,
      d.recurringRules,
      DATE_FIELDS.recurringRules,
      userId,
    );

    for (const row of d.transactionContacts ?? []) {
      t.insert(transactionContactsTable).values(row).run();
    }
    for (const row of d.settings ?? []) {
      t
        .insert(settingsTable)
        .values({ userId, key: row.key as string, value: row.value as string })
        .run();
    }
  });
}
