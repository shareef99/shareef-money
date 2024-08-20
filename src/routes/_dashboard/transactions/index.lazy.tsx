import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import AddTransaction from "@/components/dialogs/add-transaction";
import DailyTransactions from "@/routes/_dashboard/transactions/-components/daily-transactions";
import CalenderTransactions from "@/routes/_dashboard/transactions/-components/calender-transactions";
import { z } from "zod";
import { transactionTabs } from "@/types/enums";
import { format } from "date-fns";
import {
  useMonthlyTransactions,
  useTransactions,
} from "@/routes/_dashboard/transactions/-query";
import { useAuth } from "@/store/auth";
import ErrorMessage from "@/components/error-message";
import { Skeleton } from "@/components/ui/skeleton";
import MonthlyTransactions from "@/routes/_dashboard/transactions/-components/monthly-transactions";

// eslint-disable-next-line react-refresh/only-export-components
export const transactionsSchema = z.object({
  month: z
    .number({ invalid_type_error: "Required" })
    .min(1, "Required")
    .max(12, "Required")
    .catch(new Date().getMonth() + 1),
  year: z
    .number({ invalid_type_error: "Required" })
    .min(1, "Required")
    .max(9999, "Required")
    .catch(new Date().getFullYear()),
  tab: z.enum(transactionTabs).catch("daily"),
  addTransaction: z.boolean().catch(false),
});

export const Route = createFileRoute("/_dashboard/transactions/")({
  component: Page,
  validateSearch: (search) => transactionsSchema.parse(search),
});

function Page() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const auth = useAuth();

  // Queries
  const { data, error } = useTransactions({
    userId: auth?.id,
    month: search.month,
    year: search.year,
  });
  const { data: monthlyData, error: monthlyError } = useMonthlyTransactions(
    auth?.id
  );

  // Functions
  const monthChangeHandler = (month: number, year: number) => {
    navigate({ search: transactionsSchema.parse({ ...search, month, year }) });
  };

  return (
    <main className="min-h-[calc(100vh-64px)]">
      <div className="flex sticky top-0 pt-4 bg-background items-center justify-between w-full">
        <div className="flex justify-start items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (search.month === 1) {
                monthChangeHandler(12, search.year - 1);
                return;
              }
              monthChangeHandler(search.month - 1, search.year);
            }}
          >
            <ChevronLeft />
          </Button>
          <div className="mx-2">
            {format(`${search.year} ${search.month} 0${1}`, "MMM yyyy")}{" "}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (search.month === 12) {
                monthChangeHandler(1, search.year + 1);
                return;
              }
              monthChangeHandler(search.month + 1, search.year);
            }}
          >
            <ChevronRight />
          </Button>
        </div>
        <Button
          className="rounded-full"
          size="icon"
          onClick={() =>
            navigate({ search: { ...search, addTransaction: true } })
          }
        >
          <Plus />
        </Button>
      </div>
      <Tabs
        defaultValue="daily"
        value={search.tab}
        onValueChange={(value) =>
          navigate({
            search: transactionsSchema.parse({ ...search, tab: value }),
          })
        }
      >
        <TabsList
          variant="underline"
          className="w-full sticky top-14 bg-background gap-4"
        >
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
        {error ? (
          <ErrorMessage error={error} />
        ) : data === undefined ? (
          <Skeleton fullscreen />
        ) : (
          <>
            <TabsContent value="daily">
              <DailyTransactions transactions={data.transactions} />
            </TabsContent>
            <TabsContent value="calender">
              <CalenderTransactions
                month={search.month}
                year={search.year}
                transactions={data.transactions}
              />
            </TabsContent>
            <TabsContent value="monthly">
              {monthlyError ? (
                <ErrorMessage error={monthlyError} />
              ) : monthlyData === undefined ? (
                <Skeleton fullscreen />
              ) : (
                <MonthlyTransactions transactions={monthlyData.transactions} />
              )}
            </TabsContent>
            <TabsContent value="total">total</TabsContent>
          </>
        )}
      </Tabs>

      {/* Dialogs */}
      {search.addTransaction && (
        <AddTransaction
          modal
          open={search.addTransaction}
          onOpenChange={(open) =>
            navigate({ search: { ...search, addTransaction: open } })
          }
        />
      )}
    </main>
  );
}
