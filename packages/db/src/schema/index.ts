export { usersTable, sessionsTable } from "./users";
export { accountsTable } from "./accounts";
export { categoriesTable } from "./categories";
export { contactsTable } from "./contacts";
export { locationsTable } from "./locations";
export {
  transactionsTable,
  transactionContactsTable,
} from "./transactions";
export { recurringRulesTable } from "./recurring-rules";
export { settingsTable } from "./settings";
export { syncLogTable } from "./sync-log";
export {
  usersRelations,
  sessionsRelations,
  accountsRelations,
  categoriesRelations,
  contactsRelations,
  locationsRelations,
  transactionsRelations,
  transactionContactsRelations,
  recurringRulesRelations,
  settingsRelations,
  syncLogRelations,
} from "./relations";

import type { usersTable } from "./users";
import type { sessionsTable } from "./users";
import type { accountsTable } from "./accounts";
import type { categoriesTable } from "./categories";
import type { contactsTable } from "./contacts";
import type { locationsTable } from "./locations";
import type {
  transactionsTable,
  transactionContactsTable,
} from "./transactions";
import type { recurringRulesTable } from "./recurring-rules";
import type { settingsTable } from "./settings";
import type { syncLogTable } from "./sync-log";

export type User = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;

export type Session = typeof sessionsTable.$inferSelect;
export type SessionInsert = typeof sessionsTable.$inferInsert;

export type Account = typeof accountsTable.$inferSelect;
export type AccountInsert = typeof accountsTable.$inferInsert;

export type Category = typeof categoriesTable.$inferSelect;
export type CategoryInsert = typeof categoriesTable.$inferInsert;

export type Contact = typeof contactsTable.$inferSelect;
export type ContactInsert = typeof contactsTable.$inferInsert;

export type Location = typeof locationsTable.$inferSelect;
export type LocationInsert = typeof locationsTable.$inferInsert;

export type Transaction = typeof transactionsTable.$inferSelect;
export type TransactionInsert = typeof transactionsTable.$inferInsert;

export type TransactionContact = typeof transactionContactsTable.$inferSelect;
export type TransactionContactInsert =
  typeof transactionContactsTable.$inferInsert;

export type RecurringRule = typeof recurringRulesTable.$inferSelect;
export type RecurringRuleInsert = typeof recurringRulesTable.$inferInsert;

export type Setting = typeof settingsTable.$inferSelect;
export type SettingInsert = typeof settingsTable.$inferInsert;

export type SyncLog = typeof syncLogTable.$inferSelect;
export type SyncLogInsert = typeof syncLogTable.$inferInsert;
