import {
  createTheme,
  Button,
  AppShell,
  NumberInput,
  TextInput,
  Select,
  Modal,
  DirectionProvider,
  MantineProvider as MantineProviderBase,
  type MantineProviderProps,
  defaultVariantColorsResolver,
  type VariantColorsResolver,
} from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";

const variantColorResolver: VariantColorsResolver = (input) => {
  const defaultColors = defaultVariantColorsResolver(input);

  switch (input.variant) {
    case "primary":
      return {
        background: "var(--primary)",
        hover: "var(--ring)",
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

    default:
      return defaultColors;
  }
};

const theme = createTheme({
  colors: {
    primary: [
      "var(--primary)",
      "var(--primary)",
      "var(--primary)",
      "var(--primary)",
      "var(--primary)",
      "var(--primary)",
      "var(--primary)",
      "var(--primary)",
      "var(--primary)",
      "var(--primary)",
    ],
    secondary: [
      "var(--secondary)",
      "var(--secondary)",
      "var(--secondary)",
      "var(--secondary)",
      "var(--secondary)",
      "var(--secondary)",
      "var(--secondary)",
      "var(--secondary)",
      "var(--secondary)",
      "var(--secondary)",
    ],
  },
  primaryColor: "primary",
  primaryShade: 5,
  defaultRadius: "md",
  variantColorResolver,
  components: {
    AppShell: AppShell.extend({
      styles: {
        main: {
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        },
        navbar: {
          backgroundColor: "var(--card)",
          color: "var(--card-foreground)",
          borderRight: `1px solid var(--border)`,
        },
        header: {
          backgroundColor: "var(--background)",
          borderBottom: `1px solid var(--border)`,
        },
      },
    }),
    Button: Button.extend({
      defaultProps: {
        variant: "primary",
      },
    }),
    Card: {
      defaultProps: {
        bg: "var(--card)",
        c: "var(--card-foreground)",
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
