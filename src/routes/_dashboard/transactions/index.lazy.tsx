import { useAuth } from "@/store/auth";
import { Transaction } from "@/types/transaction";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { IndianRupee, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTransactions } from "@/routes/_dashboard/transactions/-query";
import ErrorMessage from "@/components/error-message";
import AddTransaction from "@/components/dialogs/add-transaction";
import { cn } from "@/lib/utils";

export const Route = createLazyFileRoute("/_dashboard/transactions/")({
  component: Page,
});

type DailyTransaction = {
  income: number;
  expense: number;
  transactionAt: string;
  transactions: Transaction[];
};

function Page() {
  const weekends = ["sat", "sun"];
  const auth = useAuth();

  // State
  const [addTransaction, setAddTransaction] = useState<boolean>(false);
  const [dailyTransactions, setDailyTransactions] = useState<
    DailyTransaction[]
  >([]);

  // Queries
  const { data, error } = useTransactions({
    userId: auth?.id,
    month: +format(new Date(), "MM"),
    year: +format(new Date(), "yyyy"),
  });

  useEffect(() => {
    if (data) {
      const dailyTransactions: DailyTransaction[] = [];

      for (let i = 0; i < data.transactions.length; i++) {
        const transaction = data.transactions[i];
        const date = new Date(transaction.transaction_at);
        const day = date.getDay();
        if (!dailyTransactions[day]) {
          dailyTransactions[day] = {
            income: 0,
            expense: 0,
            transactionAt: format(date, "yyyy-MM-dd"),
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
          .sort(
            (a, b) =>
              new Date(b.transactionAt).getTime() -
              new Date(a.transactionAt).getTime()
          )
      );
    }
  }, [data]);

  return (
    <main className="min-h-[calc(100vh-64px)]">
      <Tabs defaultValue="daily">
        <TabsList variant="underline" className="w-full gap-4">
          <TabsTrigger variant="underline" value="daily">
            Daily
          </TabsTrigger>
          <TabsTrigger variant="underline" value="calender">
            Calender
          </TabsTrigger>
          <TabsTrigger variant="underline" value="monthly">
            Monthly
          </TabsTrigger>
          <TabsTrigger variant="underline" value="total">
            Total
          </TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
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
                        dailyTransactions.reduce(
                          (acc, t) => acc + t.expense,
                          0
                        )}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 flex-col mt-4">
                  {dailyTransactions.map((transaction, i) => (
                    <Card key={i}>
                      <CardContent className="py-4">
                        <div className="flex justify-between border-b pb-1 border-card-foreground border-solid">
                          <div className="flex items-center">
                            <span>
                              {format(transaction.transactionAt, "dd")}
                            </span>
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
                            <div className="flex items-center justify-between">
                              <div>
                                {t.category.name}
                                {t.sub_category.name.toLowerCase() === "default"
                                  ? ""
                                  : ` / ${t.sub_category.name}`}
                              </div>
                              <div>{t.account.name}</div>
                              <div
                                className={cn(
                                  "flex items-center justify-end w-28",
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
        </TabsContent>
        <TabsContent value="calender">calender</TabsContent>
        <TabsContent value="monthly">monthly</TabsContent>
        <TabsContent value="total">total</TabsContent>
      </Tabs>

      <Button
        className="absolute bottom-8 right-8 rounded-full"
        size="icon"
        onClick={() => setAddTransaction(true)}
      >
        <Plus />
      </Button>

      {/* Dialogs */}
      <AddTransaction
        modal
        open={addTransaction}
        onOpenChange={setAddTransaction}
      />
    </main>
  );
}
