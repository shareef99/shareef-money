import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Button, Modal } from "@mantine/core";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { formatCurrency, setActiveCurrency } from "@shareef-money/shared/utils";
import { getTransactions, useDeleteTransaction } from "../../queries/transactions";
import { getAccounts } from "../../queries/accounts";
import { getCategories } from "../../queries/categories";
import { getContacts } from "../../queries/contacts";
import { getLocations } from "../../queries/locations";
import { getSettings } from "../../queries/settings";
import { Title } from "../../components/ui/title";
import { Text } from "../../components/ui/text";
import { Table } from "../../components/ui/table";
import { TransactionFormModal } from "../../components/transactions/transaction-form-modal";
import { successNotification } from "../../lib/notifications";
import { cn } from "../../lib/cn";
import type { Transaction } from "../../lib/types";

export const Route = createFileRoute("/_app/transactions")({
  loader: async ({ context: { queryClient } }) => {
    const settings = await queryClient.ensureQueryData(getSettings());
    setActiveCurrency(settings.currency_code);
    await Promise.all([
      queryClient.ensureQueryData(getTransactions({ limit: 500 })),
      queryClient.ensureQueryData(getAccounts()),
      queryClient.ensureQueryData(getCategories()),
      queryClient.ensureQueryData(getContacts()),
      queryClient.ensureQueryData(getLocations()),
    ]);
  },
  component: TransactionsPage,
});

const TYPE_LABEL: Record<string, string> = {
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
  debt_lend: "You gave",
  debt_borrow: "You got",
};

function amountColor(type: string) {
  if (type === "income" || type === "debt_borrow") return "text-income";
  if (type === "expense" || type === "debt_lend") return "text-expense";
  return "text-transfer";
}

function amountSign(type: string) {
  if (type === "expense" || type === "debt_lend") return "-";
  if (type === "income" || type === "debt_borrow") return "+";
  return "";
}

function TransactionsPage() {
  const { data: txns } = useSuspenseQuery(getTransactions({ limit: 500 }));
  const { data: accounts } = useSuspenseQuery(getAccounts());
  const { data: categories } = useSuspenseQuery(getCategories());
  const { data: contacts } = useSuspenseQuery(getContacts());
  const { data: locations } = useSuspenseQuery(getLocations());

  const deleteTxn = useDeleteTransaction();
  const [formOpened, formHandlers] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<Transaction | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [anchor, setAnchor] = useState(() => new Date());

  const { monthTxns, income, expense, label } = useMemo(() => {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999);
    const inMonth = txns.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
    let inc = 0;
    let exp = 0;
    for (const t of inMonth) {
      if (t.type === "income") inc += t.amount;
      else if (t.type === "expense") exp += t.amount;
    }
    return {
      monthTxns: inMonth,
      income: inc,
      expense: exp,
      label: anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }, [txns, anchor]);

  const byId = useMemo(
    () => new Map(monthTxns.map((t) => [String(t.id), t])),
    [monthTxns],
  );

  const shiftMonth = (delta: number) =>
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + delta, 1));

  const openAdd = () => {
    setEditTarget(undefined);
    formHandlers.open();
  };
  const openEdit = (t: Transaction) => {
    setEditTarget(t);
    formHandlers.open();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteTxn.mutate(deleteTarget.id, {
      onSuccess: () => successNotification({ message: "Transaction deleted" }),
    });
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Title order={1}>Transactions</Title>
        <Button leftSection={<Plus size={16} />} onClick={openAdd}>
          Add transaction
        </Button>
      </div>

      {/* Month nav + totals */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <ActionIcon variant="muted" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={18} />
          </ActionIcon>
          <Text as="span" weight="semibold" size="base" className="w-40 text-center">
            {label}
          </Text>
          <ActionIcon variant="muted" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight size={18} />
          </ActionIcon>
        </div>
        <div className="flex gap-6">
          <div>
            <Text variant="secondary" size="xs">
              Income
            </Text>
            <p className="text-income font-semibold">{formatCurrency(income)}</p>
          </div>
          <div>
            <Text variant="secondary" size="xs">
              Expense
            </Text>
            <p className="text-expense font-semibold">{formatCurrency(expense)}</p>
          </div>
          <div>
            <Text variant="secondary" size="xs">
              Net
            </Text>
            <p
              className={cn(
                "font-semibold",
                income - expense >= 0 ? "text-income" : "text-expense",
              )}
            >
              {formatCurrency(income - expense)}
            </p>
          </div>
        </div>
      </div>

      <Table
        header={{
          date: "Date",
          type: "Type",
          category: "Category",
          account: "Account",
          amount: "Amount",
          note: "Note",
        }}
        emptyStateText="No transactions this month."
        rows={monthTxns.map((t) => ({
          id: String(t.id),
          date: new Date(t.date),
          type: TYPE_LABEL[t.type] ?? t.type,
          category: t.categoryName ?? (t.type === "transfer" ? "Transfer" : ""),
          account: t.accountName ?? "",
          amount: t.amount,
          note: t.note ?? "",
        }))}
        cellRenderers={{
          amount: (row) => {
            const t = byId.get(row.id);
            if (!t) return null;
            return (
              <span className={cn("font-medium", amountColor(t.type))}>
                {amountSign(t.type)}
                {formatCurrency(t.amount)}
              </span>
            );
          },
        }}
        renderActions={(row) => {
          const t = byId.get(row.id);
          if (!t) return null;
          const isDebt = t.type === "debt_lend" || t.type === "debt_borrow";
          return (
            <div className="flex items-center justify-end gap-1">
              {!isDebt && (
                <ActionIcon
                  variant="muted"
                  size="sm"
                  aria-label="Edit"
                  onClick={() => openEdit(t)}
                >
                  <Pencil size={15} />
                </ActionIcon>
              )}
              <ActionIcon
                variant="muted"
                size="sm"
                aria-label="Delete"
                onClick={() => setDeleteTarget(t)}
              >
                <Trash2 size={15} className="text-expense" />
              </ActionIcon>
            </div>
          );
        }}
      />

      {formOpened && (
        <TransactionFormModal
          opened={formOpened}
          onClose={formHandlers.close}
          accounts={accounts}
          categories={categories}
          contacts={contacts}
          locations={locations}
          transaction={editTarget}
        />
      )}

      <Modal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete transaction?"
      >
        <Text variant="secondary" className="mb-4">
          This will remove the transaction. You can re-add it if needed.
        </Text>
        <div className="flex justify-end gap-2">
          <Button variant="muted" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
