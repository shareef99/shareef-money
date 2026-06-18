import { useState } from "react";
import { Modal, SegmentedControl, Select, TextInput, ColorInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import type { CategoryType } from "@shareef-money/shared/types";
import { useCreateCategory, useUpdateCategory } from "../../queries/categories";
import { errorNotification, successNotification } from "../../lib/notifications";
import type { Category } from "../../lib/types";

type FormValues = {
  name: string;
  parentId: string;
  color: string;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  categories: Category[];
  category?: Category;
};

export function CategoryFormModal({ opened, onClose, categories, category }: Props) {
  const isEdit = !!category;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [type, setType] = useState<CategoryType>(category?.type ?? "expense");

  const { getInputProps, onSubmit, reset, setFieldError, setFieldValue } = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: category
      ? {
          name: category.name,
          parentId: category.parentId ? String(category.parentId) : "",
          color: category.color ?? "",
        }
      : undefined,
  });

  const parentOptions = categories
    .filter((c) => c.parentId === null && c.type === type && c.id !== category?.id)
    .map((c) => ({ value: String(c.id), label: c.name }));

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
    const parentId = values.parentId ? Number(values.parentId) : null;
    const color = values.color?.trim() || null;

    try {
      if (isEdit) {
        await updateCategory.mutateAsync({ id: category.id, payload: { name, type, parentId, color } });
        successNotification({ message: "Category updated" });
      } else {
        await createCategory.mutateAsync({ name, type, parentId, color: color ?? undefined });
        successNotification({ message: "Category created" });
      }
      close();
    } catch {
      errorNotification({ message: "Could not save the category" });
    }
  };

  const submitting = createCategory.isPending || updateCategory.isPending;

  return (
    <Modal opened={opened} onClose={close} title={isEdit ? "Edit category" : "New category"}>
      <form onSubmit={onSubmit(handleSubmit)} className="flex flex-col gap-4">
        <SegmentedControl
          fullWidth
          value={type}
          onChange={(v) => {
            setType(v as CategoryType);
            setFieldValue("parentId", "");
          }}
          data={[
            { label: "Expense", value: "expense" },
            { label: "Income", value: "income" },
          ]}
        />
        <TextInput label="Name" placeholder="Category name" {...getInputProps("name")} />
        <Select
          label="Parent category"
          placeholder="None (top level)"
          data={parentOptions}
          searchable
          clearable
          withAsterisk={false}
          {...getInputProps("parentId")}
        />
        <ColorInput
          label="Color"
          placeholder="Optional"
          format="hex"
          withAsterisk={false}
          {...getInputProps("color")}
        />
        <Button type="submit" loading={submitting} className="mt-2">
          {isEdit ? "Save changes" : "Create category"}
        </Button>
      </form>
    </Modal>
  );
}
