import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Badge, Button, Modal } from "@mantine/core";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatCurrency, setActiveCurrency } from "@shareef-money/shared/utils";
import { computeAccountBalances } from "@shareef-money/shared/calc";
import { getAccounts, useArchiveAccount } from "../../queries/accounts";
import { getTransactions } from "../../queries/transactions";
import { getSettings } from "../../queries/settings";
import { Title } from "../../components/ui/title";
import { Text } from "../../components/ui/text";
import { AccountFormModal } from "../../components/accounts/account-form-modal";
import { successNotification } from "../../lib/notifications";
import { cn } from "../../lib/cn";
import type { Account } from "../../lib/types";

export const Route = createFileRoute("/_app/accounts")({
  loader: async ({ context: { queryClient } }) => {
    const settings = await queryClient.ensureQueryData(getSettings());
    setActiveCurrency(settings.currencyCode);
    await Promise.all([
      queryClient.ensureQueryData(getAccounts()),
      queryClient.ensureQueryData(getTransactions({ limit: 500 })),
    ]);
  },
  component: AccountsPage,
});

function AccountsPage() {
  const { data: accounts } = useSuspenseQuery(getAccounts());
  const { data: txns } = useSuspenseQuery(getTransactions({ limit: 500 }));
  const archiveAccount = useArchiveAccount();

  const [formOpened, formHandlers] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<Account | undefined>(undefined);
  const [archiveTarget, setArchiveTarget] = useState<Account | null>(null);

  const { balances, total } = useMemo(
    () =>
      computeAccountBalances(
        accounts,
        txns.map((t) => ({
          type: t.type,
          amount: t.amount,
          fee: t.fee,
          accountId: t.accountId,
          toAccountId: t.toAccountId,
        })),
      ),
    [accounts, txns],
  );

  const openAdd = () => {
    setEditTarget(undefined);
    formHandlers.open();
  };
  const openEdit = (a: Account) => {
    setEditTarget(a);
    formHandlers.open();
  };

  const confirmArchive = () => {
    if (!archiveTarget) return;
    archiveAccount.mutate(archiveTarget.id, {
      onSuccess: () => successNotification({ message: "Account archived" }),
    });
    setArchiveTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Title order={1}>Accounts</Title>
        <Button leftSection={<Plus size={16} />} onClick={openAdd}>
          New account
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <Text variant="secondary" size="xs">
          Total in accounts
        </Text>
        <p className={cn("text-3xl font-bold", total >= 0 ? "text-text" : "text-expense")}>
          {formatCurrency(total)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => {
          const balance = balances[a.id] ?? 0;
          return (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: a.color ?? "var(--text-muted)" }}
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-text">{a.name}</p>
                  <p className={cn("text-sm", balance >= 0 ? "text-text-secondary" : "text-expense")}>
                    {formatCurrency(balance)}
                  </p>
                </div>
                {a.isHidden && (
                  <Badge color="gray" variant="light" radius="sm">
                    Hidden
                  </Badge>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <ActionIcon variant="muted" size="sm" aria-label="Edit" onClick={() => openEdit(a)}>
                  <Pencil size={15} />
                </ActionIcon>
                <ActionIcon
                  variant="muted"
                  size="sm"
                  aria-label="Archive"
                  onClick={() => setArchiveTarget(a)}
                >
                  <Trash2 size={15} className="text-expense" />
                </ActionIcon>
              </div>
            </div>
          );
        })}
      </div>

      {formOpened && (
        <AccountFormModal opened={formOpened} onClose={formHandlers.close} account={editTarget} />
      )}

      <Modal
        opened={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title={`Archive "${archiveTarget?.name}"?`}
      >
        <Text variant="secondary" className="mb-4">
          The account is hidden from lists. Its transactions are kept.
        </Text>
        <div className="flex justify-end gap-2">
          <Button variant="muted" onClick={() => setArchiveTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmArchive}>
            Archive
          </Button>
        </div>
      </Modal>
    </div>
  );
}
