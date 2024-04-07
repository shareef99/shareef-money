"use client";

import { clientApi } from "@/api";
import { Account } from "@/types/account";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAccounts } from "@/app/(dashboard)/accounts/query";
import ErrorMessage from "@/components/error-message";
import Loader from "@/components/loader";

export default function Page() {
  const { data, error } = useAccounts(22);

  return (
    <main className="mt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
        <Link href="/accounts/new">
          <Button>Add</Button>
        </Link>
      </div>

      {error ? (
        <ErrorMessage error={error} />
      ) : !data ? (
        <Loader fullscreen />
      ) : (
        <Table className="mt-4">
          <TableCaption>A list of accounts.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Hidden</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.accounts.map((account) => (
              <TableRow key={account.ID}>
                <TableCell>{account.ID}</TableCell>
                <TableCell>{account.name}</TableCell>
                <TableCell>
                  {account.is_hidden ? "Hidden" : "Not Hidden"}
                </TableCell>
                <TableCell className="text-right">{account.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
