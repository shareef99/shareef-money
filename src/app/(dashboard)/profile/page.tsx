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
import AddSubCategory from "@/components/dialog/add-sub-category";
import { CategoryType } from "@/types/enums";

export default function Page() {
  const auth = useStore(useAuthStore, (state) => state.auth);
  const { data, error } = useCategories(auth?.id);

  // State
  const [addCategory, setAddCategory] = useState<{ type: CategoryType }>();
  const [addSubCategory, setAddSubCategory] = useState<{
    categoryId: number;
  }>();

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
                          setAddCategory({ type: "income" });
                        }}
                      >
                        <Plus className="size-6" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {data.categories.filter((c) => c.type === "income")
                      .length === 0 ? (
                      <div>No Income Categories</div>
                    ) : (
                      data.categories
                        .filter((c) => c.type === "income")
                        .map((c) => (
                          <Accordion key={c.id} type="multiple">
                            <AccordionItem value={c.id.toString()}>
                              <AccordionTrigger>{c.name}</AccordionTrigger>
                              <AccordionContent>
                                <div className="flex justify-between items-center">
                                  <span>Sub Category</span>
                                  <Button
                                    className="rounded-full size-8 p-1"
                                    variant="secondary"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddSubCategory({ categoryId: c.id });
                                    }}
                                  >
                                    <Plus />
                                  </Button>
                                </div>
                                <div className="space-y-2 mt-2">
                                  {c.sub_categories.filter(
                                    (s) => s.name.toLowerCase() !== "default"
                                  ).length === 0 ? (
                                    <div className="ml-4">
                                      No Sub Category found (sub categories are
                                      only for Nerds and OCD buddies)
                                    </div>
                                  ) : (
                                    c.sub_categories
                                      .filter(
                                        (s) =>
                                          s.name.toLowerCase() !== "default"
                                      )
                                      .map((s) => (
                                        <div
                                          className="ml-4"
                                          key={s.id.toString()}
                                        >
                                          {s.name}
                                        </div>
                                      ))
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ))
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
                          setAddCategory({ type: "expense" });
                        }}
                      >
                        <Plus className="size-6" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {data.categories.filter((c) => c.type === "expense")
                      .length === 0 ? (
                      <div>No Expense Categories</div>
                    ) : (
                      data.categories
                        .filter((c) => c.type === "expense")
                        .map((c) => (
                          <Accordion key={c.id} type="multiple">
                            <AccordionItem value={c.id.toString()}>
                              <AccordionTrigger>{c.name}</AccordionTrigger>
                              <AccordionContent>
                                <div className="flex justify-between items-center">
                                  <span>Sub Category</span>
                                  <Button
                                    className="rounded-full size-8 p-1"
                                    variant="secondary"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddSubCategory({ categoryId: c.id });
                                    }}
                                  >
                                    <Plus />
                                  </Button>
                                </div>
                                <div className="space-y-2 mt-2">
                                  {c.sub_categories.filter(
                                    (s) => s.name.toLowerCase() !== "default"
                                  ).length === 0 ? (
                                    <div className="ml-4">
                                      No Sub Category found (sub categories are
                                      only for Nerds and OCD buddies)
                                    </div>
                                  ) : (
                                    c.sub_categories
                                      .filter(
                                        (s) =>
                                          s.name.toLowerCase() !== "default"
                                      )
                                      .map((s) => (
                                        <div
                                          className="ml-4"
                                          key={s.id.toString()}
                                        >
                                          {s.name}
                                        </div>
                                      ))
                                  )}
                                </div>
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
          type={addCategory.type}
          key={Math.random()}
        />
      )}
      {addSubCategory && (
        <AddSubCategory
          modal
          open={!!addSubCategory}
          onOpenChange={(open) => {
            if (!open) {
              setAddSubCategory(undefined);
            }
          }}
          subCategoryId={addSubCategory.categoryId}
          key={Math.random()}
        />
      )}
    </main>
  );
}
