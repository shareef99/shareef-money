import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";
import { transactionsTable } from "./transactions";
import { categoriesTable } from "./categories";
import { locationsTable } from "./locations";
import { accountsTable } from "./accounts";

// A transactional SMS detected on the device, parsed and waiting for review.
// Only messages that parse as a money movement are stored — raw inbox noise
// never enters the DB. The body stays on-device like everything else.
const SMS_IMPORT_STATUSES = ["pending", "imported", "dismissed"] as const;
const SMS_TXN_TYPES = ["income", "expense"] as const;

export const smsImportsTable = sqliteTable(
  "sms_imports",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // Stable digest of (sender, body, receivedAt) so rescans never duplicate.
    smsHash: text("sms_hash").notNull(),
    // Raw DLT sender header, e.g. "VM-HDFCBK-S".
    sender: text("sender").notNull(),
    body: text("body").notNull(),
    receivedAt: integer("received_at", { mode: "timestamp" }).notNull(),
    // Parsed fields (amount in the currency's smallest unit, like transactions).
    amount: integer("amount").notNull(),
    type: text("type", { enum: SMS_TXN_TYPES }).notNull(),
    // Last digits of the account/card the bank mentioned, e.g. "6913".
    accountLast4: text("account_last4"),
    // Brand token from the sender header, e.g. "HDFCBK" — keys account mapping.
    bankCode: text("bank_code"),
    // Merchant / person on the other side, as printed in the SMS.
    counterparty: text("counterparty"),
    refNo: text("ref_no"),
    status: text("status", { enum: SMS_IMPORT_STATUSES })
      .notNull()
      .default("pending"),
    // Set when the user (or auto-import) turns this into a transaction.
    transactionId: integer("transaction_id").references(
      () => transactionsTable.id,
    ),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("idx_sms_imports_user_hash").on(table.userId, table.smsHash),
    index("idx_sms_imports_user_status").on(table.userId, table.status),
    index("idx_sms_imports_received").on(table.receivedAt),
  ],
);

// Remembers the category (and optionally location) the user picked for a
// merchant, so repeat imports become one tap and auto-import can categorize.
export const merchantRulesTable = sqliteTable(
  "merchant_rules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // Normalized merchant key (uppercased, collapsed whitespace).
    merchant: text("merchant").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categoriesTable.id, { onDelete: "cascade" }),
    locationId: integer("location_id").references(() => locationsTable.id),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("idx_merchant_rules_user_merchant").on(
      table.userId,
      table.merchant,
    ),
  ],
);

// Maps a bank sender (+ account tail) to one of the user's accounts, so
// "HDFCBK …6913" lands in the right account automatically. accountLast4 may
// be "" as a bank-wide fallback when the SMS carries no tail digits.
export const senderAccountsTable = sqliteTable(
  "sender_accounts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    bankCode: text("bank_code").notNull(),
    accountLast4: text("account_last4").notNull().default(""),
    accountId: integer("account_id")
      .notNull()
      .references(() => accountsTable.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("idx_sender_accounts_user_key").on(
      table.userId,
      table.bankCode,
      table.accountLast4,
    ),
  ],
);
