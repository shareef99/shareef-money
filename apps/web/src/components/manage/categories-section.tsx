import { useMemo, useState } from "react";
import { ActionIcon, Badge, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Table } from "../ui/table";
import { CategoryFormModal } from "./category-form-modal";
import { useArchiveCategory } from "../../queries/categories";
import { successNotification } from "../../lib/notifications";
import type { Category } from "../../lib/types";

type Props = {
  categories: Category[];
};

export function CategoriesSection({ categories }: Props) {
  const archiveCategory = useArchiveCategory();
  const [opened, handlers] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<Category | undefined>(undefined);

  const parentName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );
  const active = categories.filter((c) => !c.isArchived);

  const openAdd = () => {
    setEditTarget(undefined);
    handlers.open();
  };
  const openEdit = (c: Category) => {
    setEditTarget(c);
    handlers.open();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button leftSection={<Plus size={16} />} onClick={openAdd}>
          New category
        </Button>
      </div>

      <Table
        header={{ name: "Name", type: "Type", parent: "Parent", color: "Color" }}
        emptyStateText="No categories yet."
        rows={active.map((c) => ({
          id: String(c.id),
          name: c.name,
          type: c.type,
          parent: c.parentId != null ? (parentName.get(c.parentId) ?? "—") : "—",
          color: c.color ?? "",
        }))}
        cellRenderers={{
          type: (row) => (
            <Badge
              size="sm"
              radius="sm"
              variant="light"
              color={row.type === "income" ? "blue" : "gray"}
            >
              {String(row.type)}
            </Badge>
          ),
          color: (row) =>
            row.color ? (
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: String(row.color) }}
                />
                <span className="text-text-muted">{String(row.color)}</span>
              </span>
            ) : (
              <span className="text-text-muted">—</span>
            ),
        }}
        renderActions={(row) => {
          const c = active.find((x) => String(x.id) === row.id);
          if (!c) return null;
          return (
            <div className="flex items-center justify-end gap-1">
              <ActionIcon variant="muted" size="sm" aria-label="Edit" onClick={() => openEdit(c)}>
                <Pencil size={15} />
              </ActionIcon>
              <ActionIcon
                variant="muted"
                size="sm"
                aria-label="Delete"
                onClick={() =>
                  archiveCategory.mutate(c.id, {
                    onSuccess: () => successNotification({ message: "Category archived" }),
                  })
                }
              >
                <Trash2 size={15} className="text-expense" />
              </ActionIcon>
            </div>
          );
        }}
      />

      {opened && (
        <CategoryFormModal
          opened={opened}
          onClose={handlers.close}
          categories={categories}
          category={editTarget}
        />
      )}
    </div>
  );
}
