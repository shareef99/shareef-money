import "@mantine/core";

type ExtendedButtonVariant =
  | "primary"
  | "primary-outline"
  | "secondary"
  | "destructive"
  | "ghost";

declare module "@mantine/core" {
  export interface ButtonProps {
    variant?: ExtendedButtonVariant;
  }

  export interface ActionIconProps {
    variant?: ExtendedButtonVariant;
  }
}
