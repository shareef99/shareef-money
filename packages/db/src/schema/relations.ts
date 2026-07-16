import { relations } from "drizzle-orm";
import { usersTable, sessionsTable } from "./users";
import { accountsTable } from "./accounts";
import { categoriesTable } from "./categories";
import { contactsTable } from "./contacts";
import { locationsTable } from "./locations";
import { transactionsTable, transactionContactsTable } from "./transactions";
import { recurringRulesTable } from "./recurring-rules";
import { settingsTable } from "./settings";
import { syncLogTable } from "./sync-log";
import {
  smsImportsTable,
  merchantRulesTable,
  senderAccountsTable,
} from "./sms-imports";

// All relations live here (not in the table files) so the schema import
// graph stays one-directional: table files only import their FK targets,
// which avoids Metro require cycles between parent and child tables.

export const usersRelations = relations(usersTable, ({ many }) => ({
  sessions: many(sessionsTable),
  accounts: many(accountsTable),
  categories: many(categoriesTable),
  transactions: many(transactionsTable),
  recurringRules: many(recurringRulesTable),
  settings: many(settingsTable),
  syncLogs: many(syncLogTable),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));

export const accountsRelations = relations(accountsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
  transactions: many(transactionsTable),
}));

export const categoriesRelations = relations(
  categoriesTable,
  ({ one, many }) => ({
    user: one(usersTable, {
      fields: [categoriesTable.userId],
      references: [usersTable.id],
    }),
    parent: one(categoriesTable, {
      fields: [categoriesTable.parentId],
      references: [categoriesTable.id],
      relationName: "parentChild",
    }),
    subcategories: many(categoriesTable, { relationName: "parentChild" }),
    transactions: many(transactionsTable),
  }),
);

export const contactsRelations = relations(contactsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [contactsTable.userId],
    references: [usersTable.id],
  }),
}));

export const locationsRelations = relations(
  locationsTable,
  ({ one, many }) => ({
    user: one(usersTable, {
      fields: [locationsTable.userId],
      references: [usersTable.id],
    }),
    transactions: many(transactionsTable),
  }),
);

export const transactionsRelations = relations(
  transactionsTable,
  ({ one, many }) => ({
    user: one(usersTable, {
      fields: [transactionsTable.userId],
      references: [usersTable.id],
    }),
    category: one(categoriesTable, {
      fields: [transactionsTable.categoryId],
      references: [categoriesTable.id],
    }),
    account: one(accountsTable, {
      fields: [transactionsTable.accountId],
      references: [accountsTable.id],
      relationName: "sourceAccount",
    }),
    toAccount: one(accountsTable, {
      fields: [transactionsTable.toAccountId],
      references: [accountsTable.id],
      relationName: "destinationAccount",
    }),
    location: one(locationsTable, {
      fields: [transactionsTable.locationId],
      references: [locationsTable.id],
    }),
    // Debt counterparty (single person) for debt_lend / debt_borrow.
    contact: one(contactsTable, {
      fields: [transactionsTable.contactId],
      references: [contactsTable.id],
    }),
    transactionContacts: many(transactionContactsTable),
    recurringRules: many(recurringRulesTable),
  }),
);

export const transactionContactsRelations = relations(
  transactionContactsTable,
  ({ one }) => ({
    transaction: one(transactionsTable, {
      fields: [transactionContactsTable.transactionId],
      references: [transactionsTable.id],
    }),
    contact: one(contactsTable, {
      fields: [transactionContactsTable.contactId],
      references: [contactsTable.id],
    }),
  }),
);

export const recurringRulesRelations = relations(
  recurringRulesTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [recurringRulesTable.userId],
      references: [usersTable.id],
    }),
    transaction: one(transactionsTable, {
      fields: [recurringRulesTable.transactionId],
      references: [transactionsTable.id],
    }),
  }),
);

export const settingsRelations = relations(settingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [settingsTable.userId],
    references: [usersTable.id],
  }),
}));

export const syncLogRelations = relations(syncLogTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [syncLogTable.userId],
    references: [usersTable.id],
  }),
}));

export const smsImportsRelations = relations(smsImportsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [smsImportsTable.userId],
    references: [usersTable.id],
  }),
  transaction: one(transactionsTable, {
    fields: [smsImportsTable.transactionId],
    references: [transactionsTable.id],
  }),
}));

export const merchantRulesRelations = relations(
  merchantRulesTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [merchantRulesTable.userId],
      references: [usersTable.id],
    }),
    category: one(categoriesTable, {
      fields: [merchantRulesTable.categoryId],
      references: [categoriesTable.id],
    }),
    location: one(locationsTable, {
      fields: [merchantRulesTable.locationId],
      references: [locationsTable.id],
    }),
  }),
);

export const senderAccountsRelations = relations(
  senderAccountsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [senderAccountsTable.userId],
      references: [usersTable.id],
    }),
    account: one(accountsTable, {
      fields: [senderAccountsTable.accountId],
      references: [accountsTable.id],
    }),
  }),
);
