import { Modal, NumberInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { toSmallestUnit, fromSmallestUnit } from "@shareef-money/shared/utils";
import { useSetBudget } from "../../queries/budgets";
import { errorNotification, successNotification } from "../../lib/notifications";
import { Text } from "../ui/text";

type FormValues = {
  amount: number | string;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  categoryId: number;
  categoryName: string;
  monthKey: string;
  currentBudget: number;
  hasMonthOverride: boolean;
};

export function SetBudgetModal({
  opened,
  onClose,
  categoryId,
  categoryName,
  monthKey,
  currentBudget,
  hasMonthOverride,
}: Props) {
  const setBudget = useSetBudget();
  const { getInputProps, getValues, reset } = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: { amount: currentBudget > 0 ? fromSmallestUnit(currentBudget) : "" },
  });

  const close = () => {
    reset();
    onClose();
  };

  const save = async (applyToAll: boolean) => {
    const amount = toSmallestUnit(Number(getValues().amount) || 0);
    try {
      await setBudget.mutateAsync({ monthKey, categoryId, amount, applyToAll });
      successNotification({
        message: amount > 0 ? "Budget saved" : "Budget removed",
      });
      close();
    } catch {
      errorNotification({ message: "Could not save the budget" });
    }
  };

  return (
    <Modal opened={opened} onClose={close} title={`Budget · ${categoryName}`}>
      <div className="flex flex-col gap-4">
        <NumberInput
          label="Monthly budget"
          placeholder="0.00"
          min={0}
          decimalScale={2}
          withAsterisk={false}
          {...getInputProps("amount")}
        />
        <Text variant="muted" size="xs">
          Set 0 to remove the budget. “This month” overrides just {monthKey}; “All
          months” sets the default for every month.
        </Text>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            className="flex-1"
            loading={setBudget.isPending}
            onClick={() => save(false)}
          >
            This month only
          </Button>
          <Button className="flex-1" loading={setBudget.isPending} onClick={() => save(true)}>
            All months
          </Button>
        </div>
        {hasMonthOverride && (
          <Text variant="muted" size="xs">
            This category currently has a {monthKey}-specific override.
          </Text>
        )}
      </div>
    </Modal>
  );
}
