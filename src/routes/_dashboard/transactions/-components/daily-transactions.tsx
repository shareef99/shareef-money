import ErrorMessage from "@/components/error-message";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/routes/_dashboard/transactions/-query";
import { useAuth } from "@/store/auth";
import { Transaction } from "@/types/transaction";
import { format, getDate, getTime } from "date-fns";
import { IndianRupee } from "lucide-react";
import { useEffect, useState } from "react";

type DailyTransaction = {
  income: number;
  expense: number;
  transactionAt: string;
  transactions: Transaction[];
};

type Props = {
  month: number;
  year: number;
};

export default function DailyTransactions({ month, year }: Props) {
  const weekends = ["sat", "sun"];

  const auth = useAuth();

  // State
  const [dailyTransactions, setDailyTransactions] = useState<
    DailyTransaction[]
  >([]);

  // Queries
  const { data, error } = useTransactions({
    userId: auth?.id,
    month: month,
    year: year,
  });

  // Effect to convert transactions into daily transactions
  useEffect(() => {
    if (data) {
      const dailyTransactions: DailyTransaction[] = [];

      for (let i = 0; i < data.transactions.length; i++) {
        const transaction = data.transactions[i];
        const day = getDate(transaction.transaction_at);
        if (!dailyTransactions[day]) {
          dailyTransactions[day] = {
            income: 0,
            expense: 0,
            transactionAt: format(transaction.transaction_at, "yyyy-MM-dd"),
            transactions: [],
          };
        }
        if (transaction.type === "income") {
          dailyTransactions[day].income += transaction.amount;
        } else {
          dailyTransactions[day].expense += transaction.amount;
        }
        dailyTransactions[day].transactions.push(transaction);
      }

      setDailyTransactions(
        dailyTransactions
          .filter((t) => Boolean(t))
          .sort((a, b) => getTime(b.transactionAt) - getTime(a.transactionAt))
      );
    }
  }, [data]);

  return (
    <div className="flex flex-col">
      {error ? (
        <ErrorMessage error={error} />
      ) : !data ? (
        <Skeleton className="min-h-[calc(100vh-64px)]" />
      ) : (
        <div>
          <div className="flex gap-4 justify-around mt-4">
            <div className="flex flex-col items-center">
              <span>Income</span>
              <span className="text-primary">
                {dailyTransactions.reduce((acc, t) => acc + t.income, 0)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span>Expense</span>
              <span className="text-destructive">
                {dailyTransactions.reduce((acc, t) => acc + t.expense, 0)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span>Total</span>
              <span>
                {dailyTransactions.reduce((acc, t) => acc + t.income, 0) -
                  dailyTransactions.reduce((acc, t) => acc + t.expense, 0)}
              </span>
            </div>
          </div>
          <div className="flex gap-4 flex-col mt-4">
            {dailyTransactions.map((transaction, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <div className="flex justify-between border-b pb-1 border-card-foreground border-solid">
                    <div className="flex items-center">
                      <span>{format(transaction.transactionAt, "dd")}</span>
                      <Badge
                        variant={
                          weekends.includes(
                            format(
                              transaction.transactionAt,
                              "EEE"
                            ).toLowerCase()
                          )
                            ? "destructive"
                            : "secondary"
                        }
                        className="ml-2"
                      >
                        {format(transaction.transactionAt, "EEE")}
                      </Badge>
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
      )}
    </div>
  );
}
