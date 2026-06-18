import {
  Modal,
  TextInput,
  NumberInput,
  ColorInput,
  Switch,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { toSmallestUnit, fromSmallestUnit } from "@shareef-money/shared/utils";
import { useCreateAccount, useUpdateAccount } from "../../queries/accounts";
import { errorNotification, successNotification } from "../../lib/notifications";
import type { Account } from "../../lib/types";

type FormValues = {
  name: string;
  initialBalance: number | string;
  description: string;
  color: string;
  isHidden: boolean;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  account?: Account;
};

export function AccountFormModal({ opened, onClose, account }: Props) {
  const isEdit = !!account;
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const { getInputProps, onSubmit, reset, setFieldError } = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: account
      ? {
          name: account.name,
          initialBalance: fromSmallestUnit(account.initialBalance),
          description: account.description ?? "",
          color: account.color ?? "",
          isHidden: account.isHidden,
        }
      : undefined,
    validateInputOnBlur: true,
  });

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (values: FormValues) => {
    const name = values.name?.trim();
    if (!name) {
      setFieldError("name", "Enter a name");
      return;
    }
    const initialBalance = toSmallestUnit(Number(values.initialBalance) || 0);
    const description = values.description?.trim() || null;
    const color = values.color?.trim() || null;

    try {
      if (isEdit) {
        await updateAccount.mutateAsync({
          id: account.id,
          payload: { name, initialBalance, description, color, isHidden: values.isHidden },
        });
        successNotification({ message: "Account updated" });
      } else {
        await createAccount.mutateAsync({ name, initialBalance, description, color });
        successNotification({ message: "Account created" });
      }
      close();
    } catch {
      errorNotification({ message: "Could not save the account" });
    }
  };

  const submitting = createAccount.isPending || updateAccount.isPending;

  return (
    <Modal opened={opened} onClose={close} title={isEdit ? "Edit account" : "New account"}>
      <form onSubmit={onSubmit(handleSubmit)} className="flex flex-col gap-4">
        <TextInput label="Name" placeholder="e.g. Cash, HDFC" {...getInputProps("name")} />
        <NumberInput
          label={isEdit ? "Initial balance" : "Opening balance"}
          placeholder="0.00"
          decimalScale={2}
          withAsterisk={false}
          {...getInputProps("initialBalance")}
        />
        <TextInput
          label="Description"
          placeholder="Optional"
          withAsterisk={false}
          {...getInputProps("description")}
        />
        <ColorInput
          label="Color"
          placeholder="Optional"
          withAsterisk={false}
          format="hex"
          {...getInputProps("color")}
        />
        {isEdit && (
          <Switch label="Hidden (exclude from total)" {...getInputProps("isHidden", { type: "checkbox" })} />
        )}
        <Button type="submit" loading={submitting} className="mt-2">
          {isEdit ? "Save changes" : "Create account"}
        </Button>
      </form>
    </Modal>
  );
}
