"use client";

import AddTransaction from "@/components/dialog/add-transaction";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function Page() {
  // State
  const [addTransaction, setAddTransaction] = useState<boolean>(false);

  return (
    <main className="relative min-h-[calc(100vh-64px)]">
      <Tabs defaultValue="daily">
        <TabsList variant="underline">
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
        <TabsContent value="daily">daily</TabsContent>
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
