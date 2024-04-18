"use client";

import { useTransactions } from "@/app/(dashboard)/transactions/query";
import AddTransaction from "@/components/dialog/add-transaction";
import ErrorMessage from "@/components/error-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useStore from "@/store";
import { useAuthStore } from "@/store/auth";
import { format } from "date-fns";
import { IndianRupee, Plus } from "lucide-react";
import { useState } from "react";

export default function Page() {
  const weekends = ["sat", "sun"];
  const auth = useStore(useAuthStore, (state) => state.auth);

  // State
  const [addTransaction, setAddTransaction] = useState<boolean>(false);

  // Queries
  const { data, error } = useTransactions({
    userId: auth?.id,
    month: +format(new Date(), "MM"),
    year: +format(new Date(), "yyyy"),
  });

  return (
    <main className="relative min-h-[calc(100vh-64px)]">
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
                      {data.transactions
                        .filter((t) => t.type === "income")
                        .reduce((acc, transaction) => {
                          return acc + transaction.amount;
                        }, 0)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span>Expense</span>
                    <span className="text-destructive">
                      {data.transactions
                        .filter((t) => t.type === "expense")
                        .reduce((acc, transaction) => {
                          return acc + transaction.amount;
                        }, 0)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span>Total</span>
                    <span>
                      {data.transactions
                        .filter((t) => t.type === "income")
                        .reduce((acc, transaction) => {
                          return acc + transaction.amount;
                        }, 0) -
                        data.transactions
                          .filter((t) => t.type === "expense")
                          .reduce((acc, transaction) => {
                            return acc + transaction.amount;
                          }, 0)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 flex-col mt-4">
                  {data.transactions.map((transaction, i) => (
                    <Card key={i}>
                      <CardContent className="py-4">
                        <div className="flex justify-between border-b pb-1 border-card-foreground border-solid">
                          <div className="flex items-center">
                            <span>
                              {format(transaction.transaction_at, "dd")}
                            </span>
                            <Badge
                              variant={
                                weekends.includes(
                                  format(
                                    transaction.transaction_at,
                                    "EEE"
                                  ).toLowerCase()
                                )
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="ml-4 mr-2"
                            >
                              {format(transaction.transaction_at, "EEE")}
                            </Badge>
                            <span className="text-xs">
                              {format(transaction.transaction_at, "MM'.'yyyy")}
                            </span>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex items-center text-primary justify-end w-28">
                              <IndianRupee className="size-4" />
                              <span>
                                {transaction.type === "income"
                                  ? transaction.amount
                                  : 0}
                              </span>
                            </div>
                            <div className="flex items-center text-destructive justify-end w-28">
                              <IndianRupee className="size-4" />
                              <span>
                                {transaction.type === "expense"
                                  ? transaction.amount
                                  : 0}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div>
                            <div>{transaction.category.name}</div>
                            <div></div>
                            <div></div>
                          </div>
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
        className="absolute bottom-0 right-0 rounded-full"
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
