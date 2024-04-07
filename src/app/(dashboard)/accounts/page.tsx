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

export default async function Page() {
  const res = await clientApi.get("accounts/by-user", {
    searchParams: {
      user_id: 22,
    },
  });
  const data = await res.json<{ accounts: Account[] }>();
  const accounts = data.accounts;
  console.log(data.accounts);

  return (
    <main className="mt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
        <Link href="/accounts/new">
          <Button>Add</Button>
        </Link>
      </div>
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
          {accounts.map((account) => (
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
    </main>
  );
}
