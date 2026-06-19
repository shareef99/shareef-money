import {
  createTheme,
  Button,
  NumberInput,
  TextInput,
  Select,
  Modal,
  DirectionProvider,
  MantineProvider as MantineProviderBase,
  type MantineProviderProps,
  defaultVariantColorsResolver,
  type VariantColorsResolver,
  type MantineColorsTuple,
} from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";

const variantColorResolver: VariantColorsResolver = (input) => {
  const defaultColors = defaultVariantColorsResolver(input);

  switch (input.variant) {
    case "primary":
      return {
        background: "var(--primary)",
        hover: "color-mix(in srgb, var(--primary) 85%, black)",
        color: "var(--primary-foreground)",
        border: "none",
      };

    case "primary-outline":
      return {
        background: "transparent",
        hover: "color-mix(in srgb, var(--primary) 10%, transparent)",
        color: "var(--primary)",
        border: "1px solid var(--primary)",
      };

    case "secondary":
      return {
        background: "var(--card-alt)",
        hover: "color-mix(in srgb, var(--card-alt) 80%, var(--text))",
        color: "var(--text)",
        border: "none",
      };

    case "destructive":
      return {
        background: "var(--error)",
        hover: "color-mix(in srgb, var(--error) 90%, black)",
        color: "var(--primary-foreground)",
        border: "none",
      };

    case "muted":
      return {
        background: "transparent",
        hover: "color-mix(in srgb, var(--text) 8%, transparent)",
        color: "var(--text-secondary)",
        border: "none",
      };

    case "ghost":
      return {
        background: "transparent",
        hover: "color-mix(in srgb, var(--text) 8%, transparent)",
        color: "var(--text)",
        border: "none",
      };

    default:
      return defaultColors;
  }
};

const fill = (v: string): MantineColorsTuple =>
  new Array(10).fill(v) as unknown as MantineColorsTuple;

const theme = createTheme({
  colors: {
    primary: fill("var(--primary)"),
    destructive: fill("var(--error)"),
    secondary: fill("var(--card-alt)"),
  },
  primaryColor: "primary",
  primaryShade: 5,
  defaultRadius: "md",
  variantColorResolver,
  components: {
    Button: Button.extend({
      defaultProps: {
        variant: "primary",
      },
    }),
    Card: {
      defaultProps: {
        bg: "var(--card)",
        c: "var(--text)",
        withBorder: true,
      },
      styles: {
        root: { borderColor: "var(--border)" },
      },
    },
    NumberInput: NumberInput.extend({
      defaultProps: {
        hideControls: true,
        decimalScale: 2,
        withAsterisk: true,
      },
    }),
    TextInput: TextInput.extend({
      defaultProps: {
        withAsterisk: true,
      },
    }),
    Select: Select.extend({
      defaultProps: {
        withAsterisk: true,
      },
    }),
    Modal: Modal.extend({
      defaultProps: {
        centered: true,
      },
    }),
  },
});

export default function MantineProvider(props: MantineProviderProps) {
  return (
    <DirectionProvider>
      <MantineProviderBase defaultColorScheme="auto" {...props} theme={theme}>
        <Notifications />
        {props.children}
      </MantineProviderBase>
    </DirectionProvider>
  );
}
