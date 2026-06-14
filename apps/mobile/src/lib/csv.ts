type ExportTxn = {
  date: Date | number;
  type: string;
  amount: number;
  fee: number;
  note: string | null;
  description: string | null;
  category?: { name: string } | null;
  account?: { name: string } | null;
};

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function transactionsToCsv(rows: ExportTxn[]): string {
  const header = [
    "Date",
    "Type",
    "Category",
    "Account",
    "Amount",
    "Fee",
    "Note",
    "Description",
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
        (t.amount / 100).toFixed(2),
        (t.fee / 100).toFixed(2),
        esc(t.note),
        esc(t.description),
      ].join(","),
    );
  }

  return lines.join("\n");
}
