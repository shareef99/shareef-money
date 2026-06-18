import { useMemo, useState } from "react";
import { ActionIcon, Button, Modal } from "@mantine/core";
import { Trash2 } from "lucide-react";
import { computeContactEntries, type ContactDebtTxn } from "@shareef-money/shared/calc";
import { formatCurrency } from "@shareef-money/shared/utils";
import { useDeleteTransaction } from "../../queries/transactions";
import { useWriteOffDebt } from "../../queries/debts";
import { successNotification } from "../../lib/notifications";
import { Text } from "../ui/text";
import { cn } from "../../lib/cn";
import type { Account, Transaction } from "../../lib/types";
import type { DebtPreset } from "./add-debt-modal";

type Props = {
  opened: boolean;
  onClose: () => void;
  contactId: number;
  contactName: string;
  txns: Transaction[];
  accounts: Account[];
  onSettle: (preset: DebtPreset) => void;
};

export function DebtLedgerModal({
  opened,
  onClose,
  contactId,
  contactName,
  txns,
  accounts,
  onSettle,
}: Props) {
  const deleteTxn = useDeleteTransaction();
  const writeOff = useWriteOffDebt();
  const [confirmingWriteOff, setConfirmingWriteOff] = useState(false);

  const accountName = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );

  const { entries, net } = useMemo(() => {
    const ledgerTxns: ContactDebtTxn[] = txns
      .filter(
        (t) => t.contactId === contactId && (t.type === "debt_lend" || t.type === "debt_borrow"),
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((t) => ({
        id: t.id,
        type: t.type as "debt_lend" | "debt_borrow",
        amount: t.amount,
        date: new Date(t.date),
        note: t.note,
        accountId: t.accountId,
        accountName: accountName.get(t.accountId) ?? null,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        contactName,
      }));
    return computeContactEntries(ledgerTxns);
  }, [txns, contactId, contactName, accountName]);

  const settled = net === 0;
  const writeOffAccountId = entries[0]?.accountId ?? accounts[0]?.id;

  const handleSettle = () => {
    onClose();
    onSettle({
      type: net > 0 ? "debt_borrow" : "debt_lend",
      contactId,
      amount: Math.abs(net),
    });
  };

  const handleWriteOff = () => {
    if (writeOffAccountId == null) return;
    writeOff.mutate(
      { contactId, amount: net, accountId: writeOffAccountId },
      {
        onSuccess: () => {
          successNotification({ message: "Debt written off" });
          setConfirmingWriteOff(false);
          onClose();
        },
      },
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title={contactName} size="lg">
      <div className="mb-4 rounded-xl border border-border bg-card-alt p-4">
        <Text variant="secondary" size="xs">
          {net >= 0 ? "Owes you" : "You owe"}
        </Text>
        <p className={cn("text-2xl font-bold", net >= 0 ? "text-income" : "text-expense")}>
          {formatCurrency(Math.abs(net))}
        </p>
      </div>

      {!settled && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={handleSettle}>
            Settle up
          </Button>
          {net > 0 &&
            (confirmingWriteOff ? (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  loading={writeOff.isPending}
                  onClick={handleWriteOff}
                >
                  Confirm write-off
                </Button>
                <Button variant="muted" size="sm" onClick={() => setConfirmingWriteOff(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="muted" size="sm" onClick={() => setConfirmingWriteOff(true)}>
                Write off
              </Button>
            ))}
        </div>
      )}

      <ul className="flex flex-col">
        {entries.map((e) => {
          const gave = e.type === "debt_lend";
          return (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 border-b border-divider py-2.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">{gave ? "You gave" : "You got"}</p>
                <p className="text-xs text-text-muted">
                  {e.date.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  {e.accountName ? ` · ${e.accountName}` : ""}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className={cn("text-sm font-medium", gave ? "text-expense" : "text-income")}>
                    {gave ? "-" : "+"}
                    {formatCurrency(e.amount)}
                  </p>
                  <p className="text-xs text-text-muted">
                    bal {formatCurrency(Math.abs(e.runningBalance))}
                  </p>
                </div>
                <ActionIcon
                  variant="muted"
                  size="sm"
                  aria-label="Delete entry"
                  onClick={() =>
                    deleteTxn.mutate(e.id, {
                      onSuccess: () => successNotification({ message: "Entry deleted" }),
                    })
                  }
                >
                  <Trash2 size={15} className="text-expense" />
                </ActionIcon>
              </div>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
