import { useState } from "react";
import {
  Modal,
  SegmentedControl,
  NumberInput,
  Select,
  TextInput,
  Switch,
  Button,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { toSmallestUnit, fromSmallestUnit } from "@shareef-money/shared/utils";
import type { DebtType } from "@shareef-money/shared/types";
import type { TransactionCreateInput } from "@shareef-money/shared/validation";
import { useCreateTransaction, useUpdateTransaction } from "../../queries/transactions";
import { useCreateContact } from "../../queries/contacts";
import { errorNotification, successNotification } from "../../lib/notifications";
import type { Account, Contact, Transaction } from "../../lib/types";

export type DebtPreset = {
  type?: DebtType;
  contactId?: number;
  amount?: number;
};

type FormValues = {
  amount: number | string;
  contactId: string;
  accountId: string;
  date: Date;
  dueDate: Date | null;
  note: string;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  accounts: Account[];
  contacts: Contact[];
  transaction?: Transaction;
  preset?: DebtPreset;
};

const toOptions = (items: { id: number; name: string }[]) =>
  items.map((i) => ({ value: String(i.id), label: i.name }));

export function AddDebtModal({ opened, onClose, accounts, contacts, transaction, preset }: Props) {
  const isEdit = !!transaction;
  const createTxn = useCreateTransaction();
  const updateTxn = useUpdateTransaction();
  const createContact = useCreateContact();

  const initialType: DebtType =
    transaction?.type === "debt_borrow"
      ? "debt_borrow"
      : transaction?.type === "debt_lend"
        ? "debt_lend"
        : (preset?.type ?? "debt_lend");
  const [type, setType] = useState<DebtType>(initialType);
  const [newPerson, setNewPerson] = useState(false);

  const { getInputProps, onSubmit, getValues, setFieldError, reset } = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: {
      amount: transaction
        ? fromSmallestUnit(transaction.amount)
        : preset?.amount != null
          ? fromSmallestUnit(preset.amount)
          : "",
      contactId: transaction?.contactId
        ? String(transaction.contactId)
        : preset?.contactId
          ? String(preset.contactId)
          : "",
      accountId: transaction ? String(transaction.accountId) : "",
      date: transaction ? new Date(transaction.date) : new Date(),
      dueDate: transaction?.dueDate ? new Date(transaction.dueDate) : null,
      note: transaction?.note ?? "",
    },
    validateInputOnBlur: true,
  });

  const [newContactName, setNewContactName] = useState("");

  const close = () => {
    reset();
    setNewPerson(false);
    setNewContactName("");
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

    try {
      let contactId: number;
      if (newPerson) {
        const name = newContactName.trim();
        if (!name) {
          setFieldError("contactId", "Enter a name");
          return;
        }
        const created = await createContact.mutateAsync({ name });
        contactId = created.id;
      } else {
        if (!values.contactId) {
          setFieldError("contactId", "Select a person");
          return;
        }
        contactId = Number(values.contactId);
      }

      const payload: TransactionCreateInput = {
        type,
        amount,
        date: (values.date ?? new Date()).getTime(),
        accountId: Number(values.accountId),
        contactId,
        dueDate: values.dueDate ? values.dueDate.getTime() : null,
        note: values.note.trim() || undefined,
      };

      if (isEdit) {
        await updateTxn.mutateAsync({ id: transaction.id, payload });
        successNotification({ message: "Debt updated" });
      } else {
        await createTxn.mutateAsync(payload);
        successNotification({ message: "Debt recorded" });
      }
      close();
    } catch {
      errorNotification({ message: "Could not save the debt" });
    }
  };

  const submitting = createTxn.isPending || updateTxn.isPending || createContact.isPending;
  const accountLabel = type === "debt_lend" ? "From account" : "To account";

  return (
    <Modal opened={opened} onClose={close} title={isEdit ? "Edit debt" : "Record debt"}>
      <form onSubmit={onSubmit(handleSubmit)} className="flex flex-col gap-4">
        <div>
          <SegmentedControl
            fullWidth
            value={type}
            onChange={(v) => setType(v as DebtType)}
            data={[
              { label: "You gave", value: "debt_lend" },
              { label: "You got", value: "debt_borrow" },
            ]}
          />
          <p className="mt-1 text-xs text-text-muted">
            {type === "debt_lend"
              ? "Money you gave — they owe you."
              : "Money you received — you owe them."}
          </p>
        </div>

        <NumberInput
          label="Amount"
          placeholder="0.00"
          min={0}
          decimalScale={2}
          {...getInputProps("amount")}
        />

        {newPerson ? (
          <TextInput
            label="New person"
            placeholder="Name"
            value={newContactName}
            onChange={(e) => setNewContactName(e.currentTarget.value)}
          />
        ) : (
          <Select
            label="Person"
            placeholder="Select person"
            data={toOptions(contacts)}
            searchable
            {...getInputProps("contactId")}
          />
        )}
        <Switch
          label="Add a new person"
          checked={newPerson}
          onChange={(e) => setNewPerson(e.currentTarget.checked)}
        />

        <Select
          label={accountLabel}
          placeholder="Select account"
          data={toOptions(accounts)}
          searchable
          {...getInputProps("accountId")}
        />

        <DatePickerInput label="Date" valueFormat="DD MMM YYYY" {...getInputProps("date")} />
        <DatePickerInput
          label="Due date"
          placeholder="Optional"
          valueFormat="DD MMM YYYY"
          clearable
          withAsterisk={false}
          minDate={getValues().date}
          {...getInputProps("dueDate")}
        />

        <TextInput label="Note" placeholder="Optional" withAsterisk={false} {...getInputProps("note")} />

        <Button type="submit" loading={submitting} className="mt-2">
          {isEdit ? "Save changes" : "Record debt"}
        </Button>
      </form>
    </Modal>
  );
}
