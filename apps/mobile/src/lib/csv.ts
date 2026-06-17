type ExportTxn = {
  date: Date | number;
  type: string;
  amount: number;
  fee: number;
  note: string | null;
  dueDate?: Date | number | null;
  category?: { name: string } | null;
  account?: { name: string } | null;
  location?: { name: string } | null;
  // Debt counterparty (debt_lend / debt_borrow).
  contact?: { name: string } | null;
};

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const isoOrEmpty = (v: Date | number | null | undefined) => {
  if (v == null) return "";
  const d = v instanceof Date ? v : new Date(v);
  return d.toISOString();
};

export function transactionsToCsv(rows: ExportTxn[]): string {
  const header = [
    "Date",
    "Type",
    "Category",
    "Account",
    "Person",
    "Location",
    "Amount",
    "Fee",
    "Due date",
    "Note",
  ];
  const lines = [header.join(",")];

  for (const t of rows) {
    const d = t.date instanceof Date ? t.date : new Date(t.date as number);
    lines.push(
      [
        esc(d.toISOString()),
        esc(t.type),
        esc(t.category?.name ?? ""),
        esc(t.account?.name ?? ""),
        esc(t.contact?.name ?? ""),
        esc(t.location?.name ?? ""),
        (t.amount / 100).toFixed(2),
        (t.fee / 100).toFixed(2),
        esc(isoOrEmpty(t.dueDate)),
        esc(t.note),
      ].join(","),
    );
  }

  return lines.join("\n");
}
