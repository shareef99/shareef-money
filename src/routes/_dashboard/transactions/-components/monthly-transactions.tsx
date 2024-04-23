import ErrorMessage from "@/components/error-message";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMonthlyTransactions } from "@/routes/_dashboard/transactions/-query";
import { useAuth } from "@/store/auth";
import { Transaction } from "@/types/transaction";
import { format, getMonth, getYear } from "date-fns";
import { IndianRupee } from "lucide-react";
import { useEffect, useState } from "react";

type MonthlyTransaction = {
  month: number;
  year: number;
  income: number;
  expense: number;
  transactions: Transaction[];
};

export default function MonthlyTransactions() {
  const auth = useAuth();

  // State
  const [monthlyTransactions, setMonthlyTransactions] = useState<
    MonthlyTransaction[]
  >([]);

  // Queries
  const { data, error } = useMonthlyTransactions(auth?.id);

  // Effects
  useEffect(() => {
    if (!data) return;

    const monthlyTransactionsMap = new Map<string, MonthlyTransaction>();

    for (let i = 0; i < data.transactions.length; i++) {
      const transaction = data.transactions[i];
      const month = getMonth(transaction.transaction_at) + 1;
      const year = getYear(transaction.transaction_at);
      const key = `${year}-${month}`;

      if (!monthlyTransactionsMap.has(key)) {
        monthlyTransactionsMap.set(key, {
          month,
          year,
          income: 0,
          expense: 0,
          transactions: [],
        });
      }

      const monthlyTransaction = monthlyTransactionsMap.get(key)!;

      if (transaction.type === "income") {
        monthlyTransaction.income += transaction.amount;
      } else if (transaction.type === "expense") {
        monthlyTransaction.expense += transaction.amount;
      }

      monthlyTransaction.transactions.push(transaction);
    }

    setMonthlyTransactions(
      Array.from(monthlyTransactionsMap.values())
        .filter((t) => Boolean(t))
        .sort((a, b) => b.year - a.year || b.month - a.month)
    );
  }, [data]);

  return error ? (
    <ErrorMessage error={error} />
  ) : !data ? (
    <Skeleton fullscreen />
  ) : (
    <div className="flex flex-col">
      <div className="flex gap-4 bg-background sticky top-[5.625rem] justify-around mt-4">
        <div className="flex flex-col items-center">
          <span>Income</span>
          <span className="text-primary">
            {monthlyTransactions.reduce((acc, t) => acc + t.income, 0)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span>Expense</span>
          <span className="text-destructive">
            {monthlyTransactions.reduce((acc, t) => acc + t.expense, 0)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span>Total</span>
          <span>
            {monthlyTransactions.reduce((acc, t) => acc + t.income, 0) -
              monthlyTransactions.reduce((acc, t) => acc + t.expense, 0)}
          </span>
        </div>
      </div>
      <div className="flex gap-4 flex-col mt-4">
        {monthlyTransactions.map((transaction, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex justify-between border-b pb-1 border-card-foreground border-solid">
                <div className="flex items-center">
                  <span>
                    {format(
                      `${transaction.year}-${transaction.month}-01`,
                      "MMM yyyy"
                    )}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center text-primary justify-end w-28">
                    <IndianRupee className="size-4" />
                    <span>{transaction.income}</span>
                  </div>
                  <div className="flex items-center text-destructive justify-end w-28">
                    <IndianRupee className="size-4" />
                    <span>{transaction.expense}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2">
                {transaction.transactions.map((t) => (
                  <div className="grid grid-cols-3" key={t.id}>
                    <div>
                      {t.category.name}
                      {t.sub_category.name.toLowerCase() === "default"
                        ? ""
                        : ` / ${t.sub_category.name}`}
                    </div>
                    <div>{t.account.name}</div>
                    <div
                      className={cn(
                        "flex items-center justify-end ml-auto w-28",
                        t.type === "expense"
                          ? "text-destructive"
                          : "text-primary"
                      )}
                    >
                      <IndianRupee className="size-4" />
                      <span>{t.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
