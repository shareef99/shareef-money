import { createLazyFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import ErrorMessage from "@/components/error-message";
import Loader from "@/components/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/store/auth";
import { useAccounts } from "@/routes/_dashboard/accounts/-query";
import { useState } from "react";
import AddAccount from "@/components/dialogs/add-account";

export const Route = createLazyFileRoute("/_dashboard/accounts/")({
  component: Page,
});

function Page() {
  const auth = useAuth();
  const { data, error } = useAccounts(auth?.id);

  // State
  const [addAccount, setAddAccount] = useState<boolean>(false);

  return (
    <main>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
        <Button variant="secondary" onClick={() => setAddAccount(true)}>
          Add
        </Button>
      </div>
      {error ? (
        <ErrorMessage error={error} />
      ) : !data ? (
        <Loader fullscreen />
      ) : (
        <div className="grid xs:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.accounts.map((account) => (
            <Card key={account.id} x-chunk="dashboard-01-chunk-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {account.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${account.amount}</div>
                <p className="text-xs text-muted-foreground">
                  {account.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <AddAccount modal open={addAccount} onOpenChange={setAddAccount} />
    </main>
  );
}
