import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  order?: 1 | 2 | 3 | 4;
  className?: string;
  children: ReactNode;
};

const styles: Record<number, string> = {
  1: "text-2xl font-bold",
  2: "text-xl font-bold",
  3: "text-lg font-semibold",
  4: "text-base font-semibold",
};

export function Title({ order = 1, className, children }: Props) {
  const Tag = `h${order}` as "h1" | "h2" | "h3" | "h4";
  return <Tag className={twMerge("text-text", styles[order], className)}>{children}</Tag>;
}
