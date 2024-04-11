"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAccounts } from "@/app/(dashboard)/accounts/query";
import ErrorMessage from "@/components/error-message";
import Loader from "@/components/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  const { data, error } = useAccounts(22);

  return (
    <main>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
        <Link href="/accounts/new">
          <Button variant="secondary">Add</Button>
        </Link>
      </div>
      {error ? (
        <ErrorMessage error={error} />
      ) : !data ? (
        <Loader fullscreen />
      ) : (
        <div className="grid xs:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.accounts.map((account) => (
            <Card key={account.ID} x-chunk="dashboard-01-chunk-0">
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
    </main>
  );
}
