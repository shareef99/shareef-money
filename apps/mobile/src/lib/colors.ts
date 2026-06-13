// Keep these values in sync with global.css. colors.ts is used by native
// components that need raw values (tab bar, TextInput placeholder colors);
// global.css drives the NativeWind className tokens.
export const colors = {
  light: {
    background: "#FAF6EC",
    card: "#F2EBDB",
    surface: "#FFFFFF",
    text: "#26262A",
    textSecondary: "#79736A",
    textMuted: "#ABA493",
    border: "#E8DFCD",
    divider: "#EFE8D8",
    primary: "#2F80D8",
    tabBar: "#FFFFFF",
    tabBarBorder: "#E8DFCD",
    tabActive: "#2F80D8",
    tabInactive: "#9C9686",
  },
  dark: {
    background: "#121212",
    card: "#1E1E1E",
    surface: "#181818",
    text: "#ECECEC",
    textSecondary: "#A0A0A0",
    textMuted: "#6B6B6B",
    border: "#2E2E2E",
    divider: "#242424",
    primary: "#5AA0F0",
    tabBar: "#121212",
    tabBarBorder: "#2E2E2E",
    tabActive: "#5AA0F0",
    tabInactive: "#6B6B6B",
  },
} as const;

export function getColors(scheme: string | null | undefined) {
  return scheme === "dark" ? colors.dark : colors.light;
}
