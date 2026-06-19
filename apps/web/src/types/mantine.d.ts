import "@mantine/core";

type ExtendedButtonVariant =
  | "primary"
  | "primary-outline"
  | "secondary"
  | "destructive"
  | "muted"
  | "ghost";

declare module "@mantine/core" {
  export interface ButtonProps {
    variant?: ExtendedButtonVariant;
  }

  export interface ActionIconProps {
    variant?: ExtendedButtonVariant;
  }
}
