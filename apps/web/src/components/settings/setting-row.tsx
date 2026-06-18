import type { ReactNode } from "react";
import { Text } from "../ui/text";

type Props = {
  label: string;
  description?: string;
  children: ReactNode;
};

export function SettingRow({ label, description, children }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider py-4 last:border-0">
      <div className="min-w-0">
        <Text weight="medium">{label}</Text>
        {description && (
          <Text variant="muted" size="xs">
            {description}
          </Text>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
