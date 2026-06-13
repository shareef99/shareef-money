// CSS variable maps injected at the app root via NativeWind's vars().
// These set the FINAL token names (the same ones the utility classes resolve),
// with no intermediate indirection — NativeWind flattens chained vars at build
// time, which breaks runtime theme switching. Keep in sync with colors.ts and
// the @theme defaults in global.css.

export const lightVars = {
  "--color-background": "#FAF6EC",
  "--color-card": "#F2EBDB",
  "--color-card-alt": "#E9E0CD",
  "--color-surface": "#FFFFFF",
  "--color-text": "#26262A",
  "--color-text-secondary": "#79736A",
  "--color-text-muted": "#ABA493",
  "--color-border": "#E8DFCD",
  "--color-divider": "#EFE8D8",
  "--color-tab-bar": "#FFFFFF",
  "--color-tab-bar-border": "#E8DFCD",
  "--color-tab-active": "#2F80D8",
  "--color-tab-inactive": "#9C9686",
  "--color-income": "#2F80D8",
  "--color-expense": "#E0534C",
  "--color-transfer": "#6B7280",
  "--color-primary": "#2F80D8",
  "--color-success": "#2F80D8",
  "--color-error": "#E0534C",
  "--color-info": "#2F80D8",
} as const;

export const darkVars = {
  "--color-background": "#121212",
  "--color-card": "#1E1E1E",
  "--color-card-alt": "#2A2A2A",
  "--color-surface": "#181818",
  "--color-text": "#ECECEC",
  "--color-text-secondary": "#A0A0A0",
  "--color-text-muted": "#6B6B6B",
  "--color-border": "#2E2E2E",
  "--color-divider": "#242424",
  "--color-tab-bar": "#121212",
  "--color-tab-bar-border": "#2E2E2E",
  "--color-tab-active": "#5AA0F0",
  "--color-tab-inactive": "#6B6B6B",
  "--color-income": "#5AA0F0",
  "--color-expense": "#F2706A",
  "--color-transfer": "#9CA3AF",
  "--color-primary": "#5AA0F0",
  "--color-success": "#5AA0F0",
  "--color-error": "#F2706A",
  "--color-info": "#5AA0F0",
} as const;
