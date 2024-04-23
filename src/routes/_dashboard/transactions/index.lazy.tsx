import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import AddTransaction from "@/components/dialogs/add-transaction";
import DailyTransactions from "@/routes/_dashboard/transactions/-components/daily-transactions";
import CalenderTransactions from "@/routes/_dashboard/transactions/-components/calender-transactions";
import { z } from "zod";
import { transactionTabs } from "@/types/enums";

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
});

export const Route = createFileRoute("/_dashboard/transactions/")({
  component: Page,
  validateSearch: (search) => transactionsSchema.parse(search),
});

function Page() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  // State
  const [addTransaction, setAddTransaction] = useState<boolean>(false);

  // Functions
  const monthChangeHandler = (month: number, year: number) => {
    navigate({
      from: "/transactions",
      to: "/transactions",
      search: transactionsSchema.parse({
        month,
        year,
        tab: search.tab,
      }),
    });
  };

  return (
    <main className="min-h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between w-full">
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
            {search.month} {search.year}
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
          onClick={() => setAddTransaction(true)}
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
          <DailyTransactions month={search.month} year={search.year} />
        </TabsContent>
        <TabsContent value="calender">
          <CalenderTransactions />
        </TabsContent>
        <TabsContent value="monthly">monthly</TabsContent>
        <TabsContent value="total">total</TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddTransaction
        modal
        open={addTransaction}
        onOpenChange={setAddTransaction}
      />
    </main>
  );
}
