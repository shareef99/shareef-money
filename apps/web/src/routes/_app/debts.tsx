import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { Badge, Button } from "@mantine/core";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { computeDebtLedger } from "@shareef-money/shared/calc";
import { formatCurrency, setActiveCurrency } from "@shareef-money/shared/utils";
import { getTransactions } from "../../queries/transactions";
import { getAccounts } from "../../queries/accounts";
import { getContacts } from "../../queries/contacts";
import { getSettings } from "../../queries/settings";
import { toDebtLedgerTxns } from "../../lib/stats";
import { Title } from "../../components/ui/title";
import { Text } from "../../components/ui/text";
import { AddDebtModal, type DebtPreset } from "../../components/debts/add-debt-modal";
import { DebtLedgerModal } from "../../components/debts/debt-ledger-modal";
import { cn } from "../../lib/cn";

export const Route = createFileRoute("/_app/debts")({
  loader: async ({ context: { queryClient } }) => {
    const settings = await queryClient.ensureQueryData(getSettings());
    setActiveCurrency(settings.currency_code);
    await Promise.all([
      queryClient.ensureQueryData(getTransactions({ limit: 500 })),
      queryClient.ensureQueryData(getAccounts()),
      queryClient.ensureQueryData(getContacts()),
    ]);
  },
  component: DebtsPage,
});

function DebtsPage() {
  const { data: txns } = useSuspenseQuery(getTransactions({ limit: 500 }));
  const { data: accounts } = useSuspenseQuery(getAccounts());
  const { data: contacts } = useSuspenseQuery(getContacts());

  const [addOpened, addHandlers] = useDisclosure(false);
  const [preset, setPreset] = useState<DebtPreset | undefined>(undefined);
  const [ledgerContactId, setLedgerContactId] = useState<number | null>(null);

  const [now] = useState(() => Date.now());
  const ledger = useMemo(() => {
    const names = new Map(contacts.map((c) => [c.id, c.name]));
    return computeDebtLedger(toDebtLedgerTxns(txns, names), now);
  }, [txns, contacts, now]);

  const openAdd = (type: DebtPreset["type"]) => {
    setPreset({ type });
    addHandlers.open();
  };

  const ledgerName =
    ledgerContactId != null
      ? (contacts.find((c) => c.id === ledgerContactId)?.name ?? "")
      : "";

  const tiles = [
    { label: "Owed to you", value: ledger.receivable, color: "text-income" },
    { label: "You owe", value: ledger.payable, color: "text-expense" },
    { label: "Net", value: ledger.net, color: ledger.net >= 0 ? "text-income" : "text-expense" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Title order={1}>Debts</Title>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftSection={<ArrowUpRight size={16} />}
            onClick={() => openAdd("debt_lend")}
          >
            You gave
          </Button>
          <Button
            leftSection={<ArrowDownLeft size={16} />}
            onClick={() => openAdd("debt_borrow")}
          >
            You got
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-card p-4">
            <Text variant="secondary" size="xs">
              {t.label}
            </Text>
            <p className={cn("mt-1 text-lg font-bold sm:text-xl", t.color)}>
              {formatCurrency(Math.abs(t.value))}
            </p>
          </div>
        ))}
      </div>

      {ledger.people.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-text-muted">
          No outstanding debts. Use “You gave” or “You got” to record one.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {ledger.people.map((p) => (
            <li key={p.contactId}>
              <button
                type="button"
                onClick={() => setLedgerContactId(p.contactId)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-card-alt"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-text">{p.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs text-text-muted">
                      {p.net >= 0 ? "owes you" : "you owe"}
                    </span>
                    {p.dueDate && (
                      <Badge
                        size="xs"
                        radius="sm"
                        variant="light"
                        color={p.overdue ? "red" : "gray"}
                      >
                        {p.overdue ? "Overdue " : "Due "}
                        {p.dueDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </Badge>
                    )}
                  </div>
                </div>
                <span className={cn("shrink-0 font-semibold", p.net >= 0 ? "text-income" : "text-expense")}>
                  {formatCurrency(Math.abs(p.net))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {addOpened && (
        <AddDebtModal
          opened={addOpened}
          onClose={addHandlers.close}
          accounts={accounts}
          contacts={contacts}
          preset={preset}
        />
      )}

      {ledgerContactId != null && (
        <DebtLedgerModal
          opened={ledgerContactId != null}
          onClose={() => setLedgerContactId(null)}
          contactId={ledgerContactId}
          contactName={ledgerName}
          txns={txns}
          accounts={accounts}
          onSettle={(p) => {
            setPreset(p);
            addHandlers.open();
          }}
        />
      )}
    </div>
  );
}
