"use client";

import { Dialog, DialogContent, DialogProps } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addHours } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/app/(dashboard)/profile/query";
import useStore from "@/store";
import { useAuthStore } from "@/store/auth";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseError } from "@/helpers/general";
import AddCategory from "@/components/dialog/add-category";
import { TransactionType } from "@/types/enums";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { useAccounts } from "@/app/(dashboard)/accounts/query";
import { Textarea } from "@/components/ui/textarea";
import { useAddTransaction } from "@/app/(dashboard)/transactions/query";

type Props = DialogProps;

const schema = z.object({
  amount: z
    .number({ invalid_type_error: "Required" })
    .positive("Must be positive"),
  notes: z
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v))
    .default(null),
  account_id: z.string().min(1, "Required"),
  category_id: z.string().min(1, "Required"),
  sub_category_id: z
    .string()
    .nullable()
    .transform((v) => (v === "" ? null : v))
    .default(null),
});

type FormValues = z.infer<typeof schema>;

export default function AddTransaction({ ...props }: Props) {
  const auth = useStore(useAuthStore, (state) => state.auth);

  // State
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<string>(format(new Date(), "HH:mm"));
  const [addCategory, setAddCategory] = useState<{
    isIncome: boolean;
    open: boolean;
  }>({
    isIncome: transactionType === "income",
    open: false,
  });

  // Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  // Query
  const { data: categoryData, error: categoryError } = useCategories(auth?.ID);
  const { data: accountData, error: accountError } = useAccounts(auth?.ID);

  // Mutations
  const { mutateAsync } = useAddTransaction();

  // Functions
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!auth) return;

    const hoursToAdd = +time.split(":")[0];
    const dateWithTime = addHours(date, hoursToAdd);
    const utcDateWithTime = formatInTimeZone(
      dateWithTime,
      "UTC",
      "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
    );
    const transactionAt = utcDateWithTime;

    await mutateAsync({
      transaction_at: transactionAt,
      amount: data.amount,
      account_id: +data.account_id,
      category_id: +data.category_id,
      notes: data.notes,
      type: transactionType,
      user_id: auth.ID,
    });
    props.onOpenChange(false);
  };

  return (
    <Dialog {...props}>
      <DialogContent>
        <form
          onSubmit={handleSubmit(onSubmit, (e) => console.log(e))}
          className="flex flex-col gap-4"
        >
          <Tabs
            value={transactionType}
            onValueChange={(value) =>
              setTransactionType(value as TransactionType)
            }
          >
            <TabsList className="flex mx-auto w-fit">
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
            </TabsList>
          </Tabs>
          <Popover>
            <div className="flex items-center gap-4">
              <Label>Date</Label>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => {
                  if (date) {
                    setDate(date);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <div>
            <div className="flex items-center gap-4">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                {...register("amount", {
                  valueAsNumber: true,
                })}
              />
            </div>
            {errors.amount?.message && (
              <span className="text-sm text-destructive">
                {errors.amount.message}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-4">
              <Label>Account</Label>
              <Select
                onValueChange={(v) => {
                  setValue("account_id", v);
                }}
                {...register("account_id")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Account" />
                </SelectTrigger>
                <SelectContent>
                  <Button variant="ghost" className="w-full">
                    Add Account
                  </Button>
                  {accountError ? (
                    <SelectItem value="error" disabled>
                      {parseError(accountError)}
                    </SelectItem>
                  ) : !accountData ? (
                    <SelectItem value="loading" disabled>
                      loading...
                    </SelectItem>
                  ) : (
                    accountData.accounts
                      .filter((a) => !a.is_hidden)
                      .map((category) => (
                        <SelectItem
                          value={category.ID.toString()}
                          key={category.ID}
                        >
                          {category.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {errors.account_id?.message && (
              <span className="text-sm text-destructive">
                {errors.account_id.message}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-4">
              <Label>Category</Label>
              <Select
                onValueChange={(v) => {
                  setValue("category_id", v);
                }}
                {...register("category_id")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() =>
                      setAddCategory({
                        isIncome: transactionType === "income",
                        open: true,
                      })
                    }
                  >
                    Add Category
                  </Button>
                  {categoryError ? (
                    <SelectItem value="error">
                      {parseError(categoryError)}
                    </SelectItem>
                  ) : !categoryData ? (
                    <SelectItem value="loading">loading...</SelectItem>
                  ) : (
                    categoryData.categories
                      .filter((c) => {
                        if (transactionType === "income") {
                          return c.is_income;
                        } else return !c.is_income;
                      })
                      .map((category) => (
                        <SelectItem
                          value={category.ID.toString()}
                          key={category.ID}
                        >
                          {category.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {errors.category_id?.message && (
              <span className="text-sm text-destructive">
                {errors.category_id.message}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Label>Subcategory</Label>
            <Select
              onValueChange={(v) => setValue("sub_category_id", v)}
              {...register("sub_category_id")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subcategory" />
              </SelectTrigger>
              <SelectContent>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() =>
                    setAddCategory({
                      isIncome: transactionType === "income",
                      open: true,
                    })
                  }
                >
                  Add Category
                </Button>
                {categoryError ? (
                  <SelectItem value="error">
                    {parseError(categoryError)}
                  </SelectItem>
                ) : !categoryData ? (
                  <SelectItem value="loading">loading...</SelectItem>
                ) : (
                  categoryData.categories
                    .filter((c) => {
                      if (transactionType === "income") {
                        return c.is_income;
                      } else return !c.is_income;
                    })
                    .filter((c) => {
                      if (!watch("category_id")) {
                        return true;
                      }
                      return c.ID.toString() === watch("category_id");
                    })
                    .map((category) => (
                      <SelectGroup key={category.ID}>
                        <SelectLabel>{category.name}</SelectLabel>
                        {category.sub_categories.map((subcategory) => (
                          <SelectItem
                            value={subcategory.ID.toString()}
                            key={subcategory.ID}
                          >
                            {subcategory.name.toLowerCase() === "default"
                              ? category.name
                              : subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-start gap-4">
              <Label className="mt-1">Note</Label>
              <Textarea placeholder="Transaction Note" {...register("notes")} />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            Add
          </Button>
        </form>
      </DialogContent>

      {/* Dialogs */}
      <AddCategory
        modal
        open={addCategory.open}
        onOpenChange={(open) =>
          setAddCategory((prev) => ({ ...prev, open: open }))
        }
        isIncome={addCategory.isIncome}
      />
    </Dialog>
  );
}
