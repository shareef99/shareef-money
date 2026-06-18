import { useMemo, useState, type ReactNode } from "react";
import {
  ActionIcon,
  Badge,
  Checkbox,
  Divider,
  Menu,
  Table as MantineTable,
  Tooltip,
} from "@mantine/core";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Eye,
  EyeOff,
  Settings2,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

type CellValue = string | number | boolean | null | undefined | Date;
type SortDirection = "asc" | "desc";
type TableHeader = Record<string, string>;

type RowFromHeader<THeader extends TableHeader> = {
  [K in keyof THeader]: CellValue;
} & { id: string };

type Props<THeader extends TableHeader> = {
  header: THeader;
  rows: RowFromHeader<THeader>[];
  withColors?: boolean;
  emptyStateText?: string;
  enableColumnVisibility?: boolean;
  renderActions?: (row: RowFromHeader<THeader>) => ReactNode;
};

function getComparableValue(value: CellValue): string | number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return String(value ?? "").toLowerCase();
}

function renderCell(value: CellValue, withColors: boolean) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-text-muted">-</span>;
  }

  if (typeof value === "boolean" && withColors) {
    return (
      <Badge color={value ? "teal" : "gray"} variant="light" radius="sm">
        {value ? "Yes" : "No"}
      </Badge>
    );
  }

  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

export function Table<THeader extends TableHeader>({
  header,
  rows,
  withColors = true,
  emptyStateText = "No records found.",
  enableColumnVisibility = true,
  renderActions,
}: Props<THeader>) {
  const headerKeys = useMemo(
    () => Object.keys(header) as Array<keyof THeader>,
    [header],
  );
  const [sortKey, setSortKey] = useState<keyof THeader | null>(headerKeys[0] ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [hiddenColumns, setHiddenColumns] = useState<Array<keyof THeader>>([]);

  const visibleKeys = useMemo(
    () => headerKeys.filter((key) => !hiddenColumns.includes(key)),
    [headerKeys, hiddenColumns],
  );

  const sortedRows = useMemo(() => {
    if (!sortKey || hiddenColumns.includes(sortKey)) return rows;

    return [...rows].sort((left, right) => {
      const leftValue = getComparableValue(left[sortKey]);
      const rightValue = getComparableValue(right[sortKey]);

      if (leftValue < rightValue) return sortDirection === "asc" ? -1 : 1;
      if (leftValue > rightValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [hiddenColumns, rows, sortDirection, sortKey]);

  const handleSort = (key: keyof THeader) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const toggleColumn = (key: keyof THeader) => {
    setHiddenColumns((current) =>
      current.includes(key)
        ? current.filter((column) => column !== key)
        : [...current, key],
    );
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-text-muted">
        {emptyStateText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      {enableColumnVisibility && (
        <div className="flex items-center justify-end border-b border-border p-2">
          <Menu shadow="md" width={240} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="muted" size="sm" aria-label="Manage columns">
                <Settings2 size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Visible Columns</Menu.Label>
              <Divider />
              {headerKeys.map((key) => {
                const checked = !hiddenColumns.includes(key);
                return (
                  <Menu.Item
                    key={String(key)}
                    leftSection={checked ? <Eye size={14} /> : <EyeOff size={14} />}
                    onClick={() => toggleColumn(key)}
                    closeMenuOnClick={false}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleColumn(key)}
                      label={header[key]}
                    />
                  </Menu.Item>
                );
              })}
            </Menu.Dropdown>
          </Menu>
        </div>
      )}
      <MantineTable
        highlightOnHover
        horizontalSpacing="md"
        verticalSpacing="sm"
        striped={withColors}
        withTableBorder={false}
      >
        <MantineTable.Thead className={twMerge(withColors ? "bg-primary/10" : "bg-card-alt")}>
          <MantineTable.Tr>
            {visibleKeys.map((key) => {
              const isCurrent = sortKey === key;
              return (
                <MantineTable.Th key={String(key)} className="whitespace-nowrap text-text">
                  <div className="flex items-center gap-2">
                    <span>{header[key]}</span>
                    <Tooltip label={isCurrent ? `Sorted ${sortDirection}` : "Sort column"}>
                      <ActionIcon
                        variant="muted"
                        color={withColors && isCurrent ? "primary" : "gray"}
                        size="sm"
                        onClick={() => handleSort(key)}
                        aria-label={`Sort by ${header[key]}`}
                      >
                        {isCurrent && sortDirection === "asc" ? (
                          <ArrowUpWideNarrow size={14} />
                        ) : (
                          <ArrowDownWideNarrow size={14} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  </div>
                </MantineTable.Th>
              );
            })}
            {renderActions && (
              <MantineTable.Th className="whitespace-nowrap text-text text-right">
                Actions
              </MantineTable.Th>
            )}
          </MantineTable.Tr>
        </MantineTable.Thead>
        <MantineTable.Tbody>
          {sortedRows.map((row, rowIndex) => (
            <MantineTable.Tr key={row.id ?? `row-${rowIndex}`}>
              {visibleKeys.map((key) => (
                <MantineTable.Td key={`${String(key)}-${rowIndex}`} className="whitespace-nowrap">
                  {renderCell(row[key], withColors)}
                </MantineTable.Td>
              ))}
              {renderActions && (
                <MantineTable.Td key={`actions-${rowIndex}`} className="whitespace-nowrap text-right">
                  {renderActions(row)}
                </MantineTable.Td>
              )}
            </MantineTable.Tr>
          ))}
        </MantineTable.Tbody>
      </MantineTable>
    </div>
  );
}
