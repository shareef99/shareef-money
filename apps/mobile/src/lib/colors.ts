export const colors = {
  light: {
    background: "#FFFFFF",
    card: "#F4F4F5",
    surface: "#FAFAFA",
    text: "#09090B",
    textSecondary: "#71717A",
    textMuted: "#A1A1AA",
    border: "#E4E4E7",
    divider: "#F4F4F5",
    primary: "#2563EB",
    tabBar: "#FFFFFF",
    tabBarBorder: "#E4E4E7",
    tabActive: "#2563EB",
    tabInactive: "#71717A",
  },
  dark: {
    background: "#0A0A0A",
    card: "#18181B",
    surface: "#111111",
    text: "#FAFAFA",
    textSecondary: "#A1A1AA",
    textMuted: "#52525B",
    border: "#27272A",
    divider: "#1C1C1E",
    primary: "#3B82F6",
    tabBar: "#0A0A0A",
    tabBarBorder: "#27272A",
    tabActive: "#3B82F6",
    tabInactive: "#52525B",
  },
} as const;

export function getColors(scheme: string | null | undefined) {
  return scheme === "dark" ? colors.dark : colors.light;
}
