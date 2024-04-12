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
import { Plus } from "lucide-react";
import AddCategory from "@/components/dialog/add-category";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Page() {
  const auth = useStore(useAuthStore, (state) => state.auth);
  const { data, error } = useCategories(auth?.ID);

  // State
  const [addCategory, setAddCategory] = useState<{ isIncome: boolean }>();

  return (
    <main>
      <H1>Welcome, {auth?.name}</H1>
      <section className="my-8">
        <H2>Categories</H2>
        {error ? (
          <ErrorMessage error={error} />
        ) : !data ? (
          <Skeleton />
        ) : (
          <div>
            <div>
              <Accordion type="multiple">
                <AccordionItem value="income">
                  <AccordionTrigger>
                    <div className="flex items-center w-full justify-between">
                      <span>Income Categories</span>
                      <div
                        className="rounded-full flex items-center justify-center size-8 bg-secondary mr-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddCategory({ isIncome: true });
                        }}
                      >
                        <Plus className="size-6" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {data.categories.filter((c) => c.is_income).length === 0 ? (
                      <div>No Income Categories</div>
                    ) : (
                      data.categories
                        .filter((c) => c.is_income)
                        .map((c) => <div key={c.ID}>{c.name}</div>)
                    )}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="expense">
                  <AccordionTrigger>
                    <div className="flex items-center w-full justify-between">
                      <span>Expense Categories</span>
                      <div
                        className="rounded-full flex items-center justify-center size-8 bg-secondary mr-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddCategory({ isIncome: false });
                        }}
                      >
                        <Plus className="size-6" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {data.categories.filter((c) => !c.is_income).length ===
                    0 ? (
                      <div>No Expense Categories</div>
                    ) : (
                      data.categories
                        .filter((c) => !c.is_income)
                        .map((c) => (
                          <Accordion key={c.ID} type="multiple">
                            <AccordionItem value={c.ID.toString()}>
                              <AccordionTrigger>{c.name}</AccordionTrigger>
                              <AccordionContent>
                                <div className="flex justify-between items-center">
                                  <span>Sub Category</span>
                                  <Button
                                    className="rounded-full size-8 p-1"
                                    variant="secondary"
                                    size="icon"
                                  >
                                    <Plus />
                                  </Button>
                                </div>
                                {c.sub_categories.map((s) => (
                                  <div className="" key={s.ID.toString()}>
                                    {s.name}
                                  </div>
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ))
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        )}
      </section>

      {/* Dialogs */}
      {addCategory && (
        <AddCategory
          modal
          open={!!addCategory}
          onOpenChange={(open) => {
            if (!open) {
              setAddCategory(undefined);
            }
          }}
          isIncome={addCategory.isIncome}
          key={Math.random()}
        />
      )}
    </main>
  );
}
