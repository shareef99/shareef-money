import { fromSmallestUnit } from "@shareef-money/shared/utils";
import type { Account, Category, Contact, Location, Transaction } from "./types";

type Lookups = {
  accounts: Account[];
  categories: Category[];
  contacts: Contact[];
  locations: Location[];
};

function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

const isoDate = (value: string | number | Date) => new Date(value).toISOString().slice(0, 10);

// Machine-readable export including debt metadata (counterparty, due date).
// Amounts are major units (e.g. 50.00); types stay raw for re-import.
export function toTransactionsCsv(txns: Transaction[], lookups: Lookups): string {
  const account = new Map(lookups.accounts.map((a) => [a.id, a.name]));
  const category = new Map(lookups.categories.map((c) => [c.id, c.name]));
  const contact = new Map(lookups.contacts.map((c) => [c.id, c.name]));
  const location = new Map(lookups.locations.map((l) => [l.id, l.name]));

  const headers = [
    "Date",
    "Type",
    "Amount",
    "Fee",
    "Category",
    "Account",
    "To account",
    "Person",
    "Due date",
    "Location",
    "Note",
  ];

  const rows = txns.map((t) => [
    isoDate(t.date),
    t.type,
    fromSmallestUnit(t.amount).toFixed(2),
    fromSmallestUnit(t.fee).toFixed(2),
    t.categoryId != null ? (category.get(t.categoryId) ?? "") : "",
    account.get(t.accountId) ?? "",
    t.toAccountId != null ? (account.get(t.toAccountId) ?? "") : "",
    t.contactId != null ? (contact.get(t.contactId) ?? "") : "",
    t.dueDate ? isoDate(t.dueDate) : "",
    t.locationId != null ? (location.get(t.locationId) ?? "") : "",
    t.note ?? "",
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCell(String(cell))).join(","))
    .join("\r\n");
}

// Trigger a client-side download. The BOM keeps Excel happy with UTF-8.
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(["﻿", content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
