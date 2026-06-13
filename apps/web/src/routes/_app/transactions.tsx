import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Transactions</h1>
      <p className="text-foreground-secondary mt-2">Coming soon.</p>
    </div>
  );
}
