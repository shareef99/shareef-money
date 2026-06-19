import type { ReactNode } from "react";
import { Text } from "../ui/text";

type Props = {
  title: string;
  children: ReactNode;
};

export function SettingsSection({ title, children }: Props) {
  return (
    <section className="rounded-xl border border-border bg-card px-5 py-2">
      <Text weight="semibold" size="base" className="border-b border-divider py-3">
        {title}
      </Text>
      {children}
    </section>
  );
}
