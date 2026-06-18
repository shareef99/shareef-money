import { useState } from "react";
import {
  Modal,
  SegmentedControl,
  NumberInput,
  Select,
  MultiSelect,
  TextInput,
  Button,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { toSmallestUnit, fromSmallestUnit } from "@shareef-money/shared/utils";
import type {
  TransactionCreateInput,
  TransactionUpdateInput,
} from "@shareef-money/shared/validation";
import { useCreateTransaction, useUpdateTransaction } from "../../queries/transactions";
import { errorNotification, successNotification } from "../../lib/notifications";
import type { Account, Category, Contact, Location, Transaction } from "../../lib/types";

type FormType = "income" | "expense" | "transfer";

type FormValues = {
  amount: number | string;
  accountId: string;
  toAccountId: string;
  categoryId: string;
  fee: number | string;
  date: Date;
  note: string;
  locationId: string;
  contactIds: string[];
};

type Props = {
  opened: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  contacts: Contact[];
  locations: Location[];
  // Present when editing.
  transaction?: Transaction;
};

const toOptions = (items: { id: number; name: string }[]) =>
  items.map((i) => ({ value: String(i.id), label: i.name }));

export function TransactionFormModal({
  opened,
  onClose,
  accounts,
  categories,
  contacts,
  locations,
  transaction,
}: Props) {
  const isEdit = !!transaction;
  const createTxn = useCreateTransaction();
  const updateTxn = useUpdateTransaction();

  const initialType: FormType =
    transaction && (transaction.type === "income" || transaction.type === "transfer")
      ? transaction.type
      : transaction?.type === "expense"
        ? "expense"
        : "expense";
  const [type, setType] = useState<FormType>(initialType);

  const { getInputProps, onSubmit, getValues, setFieldError, reset } = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: {
      amount: transaction ? fromSmallestUnit(transaction.amount) : "",
      accountId: transaction ? String(transaction.accountId) : "",
      toAccountId: transaction?.toAccountId ? String(transaction.toAccountId) : "",
      categoryId: transaction?.categoryId ? String(transaction.categoryId) : "",
      fee: transaction ? fromSmallestUnit(transaction.fee) : 0,
      date: transaction ? new Date(transaction.date) : new Date(),
      note: transaction?.note ?? "",
      locationId: transaction?.locationId ? String(transaction.locationId) : "",
      contactIds: [],
    },
    validateInputOnBlur: true,
  });

  const categoryOptions = toOptions(
    categories.filter((c) => c.type === (type === "income" ? "income" : "expense")),
  );
  const accountOptions = toOptions(accounts);

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (values: FormValues) => {
    const amount = toSmallestUnit(Number(values.amount) || 0);
    if (amount <= 0) {
      setFieldError("amount", "Enter an amount");
      return;
    }
    if (!values.accountId) {
      setFieldError("accountId", "Select an account");
      return;
    }
    const date = (values.date ?? new Date()).getTime();
    const note = values.note.trim() ? values.note.trim() : undefined;
    const locationId = values.locationId ? Number(values.locationId) : undefined;
    const contactIds = values.contactIds.length
      ? values.contactIds.map(Number)
      : undefined;

    let payload: TransactionCreateInput;
    if (type === "transfer") {
      if (!values.toAccountId) {
        setFieldError("toAccountId", "Select a destination");
        return;
      }
      payload = {
        type: "transfer",
        amount,
        date,
        accountId: Number(values.accountId),
        toAccountId: Number(values.toAccountId),
        fee: toSmallestUnit(Number(values.fee) || 0),
        note,
        locationId,
        contactIds,
      };
    } else {
      if (!values.categoryId) {
        setFieldError("categoryId", "Select a category");
        return;
      }
      payload = {
        type,
        amount,
        date,
        accountId: Number(values.accountId),
        categoryId: Number(values.categoryId),
        note,
        locationId,
        contactIds,
      };
    }

    try {
      if (isEdit) {
        await updateTxn.mutateAsync({ id: transaction.id, payload: payload as TransactionUpdateInput });
        successNotification({ message: "Transaction updated" });
      } else {
        await createTxn.mutateAsync(payload);
        successNotification({ message: "Transaction added" });
      }
      close();
    } catch (e) {
      errorNotification({ message: "Could not save the transaction" });
    }
  };

  const submitting = createTxn.isPending || updateTxn.isPending;

  return (
    <Modal opened={opened} onClose={close} title={isEdit ? "Edit transaction" : "Add transaction"}>
      <form onSubmit={onSubmit(handleSubmit)} className="flex flex-col gap-4">
        <SegmentedControl
          fullWidth
          value={type}
          onChange={(v) => setType(v as FormType)}
          data={[
            { label: "Expense", value: "expense" },
            { label: "Income", value: "income" },
            { label: "Transfer", value: "transfer" },
          ]}
        />

        <NumberInput
          label="Amount"
          placeholder="0.00"
          min={0}
          decimalScale={2}
          {...getInputProps("amount")}
        />

        <DatePickerInput label="Date" valueFormat="DD MMM YYYY" {...getInputProps("date")} />

        <Select
          label="Account"
          placeholder="Select account"
          data={accountOptions}
          searchable
          {...getInputProps("accountId")}
        />

        {type === "transfer" ? (
          <>
            <Select
              label="To account"
              placeholder="Select destination"
              data={accountOptions.filter((o) => o.value !== getValues().accountId)}
              searchable
              {...getInputProps("toAccountId")}
            />
            <NumberInput label="Fee" placeholder="0.00" min={0} decimalScale={2} withAsterisk={false} {...getInputProps("fee")} />
          </>
        ) : (
          <Select
            label="Category"
            placeholder="Select category"
            data={categoryOptions}
            searchable
            {...getInputProps("categoryId")}
          />
        )}

        <TextInput label="Note" placeholder="Optional" withAsterisk={false} {...getInputProps("note")} />

        <Select
          label="Location"
          placeholder="Optional"
          data={toOptions(locations)}
          searchable
          clearable
          withAsterisk={false}
          {...getInputProps("locationId")}
        />

        <MultiSelect
          label="People"
          placeholder="Optional"
          data={toOptions(contacts)}
          searchable
          withAsterisk={false}
          {...getInputProps("contactIds")}
        />

        <Button type="submit" loading={submitting} className="mt-2">
          {isEdit ? "Save changes" : "Add transaction"}
        </Button>
      </form>
    </Modal>
  );
}
