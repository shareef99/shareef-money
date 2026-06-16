// A stable, readable palette for category slices/bars in stats.
export const CHART_COLORS = [
  "#2F80D8",
  "#E0534C",
  "#E8A33D",
  "#3FB68B",
  "#9B6FD4",
  "#E06FA8",
  "#5BB0C9",
  "#C9883D",
  "#7A8B9A",
  "#8FB339",
  "#D96E4B",
  "#5C6BC0",
];

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]!;
}
