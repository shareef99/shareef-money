import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  as?: "p" | "span" | "div";
  variant?: "default" | "secondary" | "muted";
  size?: "xs" | "sm" | "base" | "lg";
  weight?: "normal" | "medium" | "semibold" | "bold";
  className?: string;
  children: ReactNode;
};

const colors: Record<string, string> = {
  default: "text-text",
  secondary: "text-text-secondary",
  muted: "text-text-muted",
};

const sizes: Record<string, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
};

const weights: Record<string, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

export function Text({
  as: Tag = "p",
  variant = "default",
  size = "sm",
  weight = "normal",
  className,
  children,
}: Props) {
  return (
    <Tag className={twMerge(colors[variant], sizes[size], weights[weight], className)}>
      {children}
    </Tag>
  );
}
