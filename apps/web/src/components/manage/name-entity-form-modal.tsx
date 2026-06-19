import { Modal, TextInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";

type FormValues = {
  name: string;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  title: string;
  initialName?: string;
  submitting: boolean;
  onSubmit: (name: string) => void;
};

// Shared single-field (name) modal for contacts and locations.
export function NameEntityFormModal({
  opened,
  onClose,
  title,
  initialName,
  submitting,
  onSubmit,
}: Props) {
  const { getInputProps, onSubmit: handle, setFieldError } = useForm<FormValues>({
    mode: "uncontrolled",
    initialValues: initialName != null ? { name: initialName } : undefined,
  });

  return (
    <Modal opened={opened} onClose={onClose} title={title}>
      <form
        onSubmit={handle((values) => {
          const name = values.name?.trim();
          if (!name) {
            setFieldError("name", "Enter a name");
            return;
          }
          onSubmit(name);
        })}
        className="flex flex-col gap-4"
      >
        <TextInput label="Name" placeholder="Name" data-autofocus {...getInputProps("name")} />
        <Button type="submit" loading={submitting} className="mt-2">
          Save
        </Button>
      </form>
    </Modal>
  );
}
