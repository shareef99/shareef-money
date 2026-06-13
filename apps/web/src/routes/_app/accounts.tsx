import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/accounts")({
  component: AccountsPage,
});

function AccountsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Accounts</h1>
      <p className="text-foreground-secondary mt-2">Coming soon.</p>
    </div>
  );
}
