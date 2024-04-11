"use client";

import H1 from "@/components/ui/h1";
import H2 from "@/components/ui/h2";
import useStore from "@/store";
import { useAuthStore } from "@/store/auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCategories } from "@/app/(dashboard)/profile/query";
import ErrorMessage from "@/components/error-message";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Page() {
  const auth = useStore(useAuthStore, (state) => state.auth);
  const { data, error } = useCategories(auth?.ID);

  return (
    <main>
      <H1>Welcome, {auth?.name}</H1>
      <section className="my-8">
        <div className="flex items-center justify-between">
          <H2>Categories</H2>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Plus />
          </Button>
        </div>
        {error ? (
          <ErrorMessage error={error} />
        ) : !data ? (
          <Skeleton />
        ) : (
          <div>
            {data.categories.length === 0 ? (
              <div>Add some categories.</div>
            ) : (
              <div>
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Income Categories</AccordionTrigger>
                    <AccordionContent>
                      {data ? "Data Fetched" : "No data"}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Expense Categories</AccordionTrigger>
                    <AccordionContent>
                      Yes. It adheres to the WAI-ARIA design pattern.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
