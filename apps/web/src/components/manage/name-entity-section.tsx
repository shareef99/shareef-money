import { useState } from "react";
import { ActionIcon, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Table } from "../ui/table";
import { NameEntityFormModal } from "./name-entity-form-modal";
import { successNotification, errorNotification } from "../../lib/notifications";

type Item = { id: number; name: string };

type Props = {
  entityLabel: string;
  items: Item[];
  onCreate: (name: string) => Promise<unknown>;
  onUpdate: (id: number, name: string) => Promise<unknown>;
  onArchive: (id: number) => void;
};

// Generic CRUD section for single-field (name) entities: contacts, locations.
export function NameEntitySection({ entityLabel, items, onCreate, onUpdate, onArchive }: Props) {
  const [opened, handlers] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<Item | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openAdd = () => {
    setEditTarget(null);
    handlers.open();
  };
  const openEdit = (item: Item) => {
    setEditTarget(item);
    handlers.open();
  };

  const submit = async (name: string) => {
    setSubmitting(true);
    try {
      if (editTarget) await onUpdate(editTarget.id, name);
      else await onCreate(name);
      successNotification({ message: `${editTarget ? "Updated" : "Added"} ${entityLabel}` });
      handlers.close();
    } catch {
      errorNotification({ message: `Could not save the ${entityLabel}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button leftSection={<Plus size={16} />} onClick={openAdd}>
          New {entityLabel}
        </Button>
      </div>

      <Table
        header={{ name: "Name" }}
        enableColumnVisibility={false}
        emptyStateText={`No ${entityLabel}s yet.`}
        rows={items.map((i) => ({ id: String(i.id), name: i.name }))}
        renderActions={(row) => {
          const item = items.find((i) => String(i.id) === row.id);
          if (!item) return null;
          return (
            <div className="flex items-center justify-end gap-1">
              <ActionIcon variant="muted" size="sm" aria-label="Edit" onClick={() => openEdit(item)}>
                <Pencil size={15} />
              </ActionIcon>
              <ActionIcon
                variant="muted"
                size="sm"
                aria-label="Delete"
                onClick={() => onArchive(item.id)}
              >
                <Trash2 size={15} className="text-expense" />
              </ActionIcon>
            </div>
          );
        }}
      />

      {opened && (
        <NameEntityFormModal
          opened={opened}
          onClose={handlers.close}
          title={editTarget ? `Edit ${entityLabel}` : `New ${entityLabel}`}
          initialName={editTarget?.name}
          submitting={submitting}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
