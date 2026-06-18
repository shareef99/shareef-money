# Stats overhaul — implementation plan

Goal: turn the Stats tab into a powerful analytics screen with comprehensive
**filters** and many **graphs**, including flow visualizations that show "how
money travels." Built in phases on a shared foundation so every chart respects
the same filters.

## Current state

`apps/mobile/src/app/(app)/(tabs)/stats/index.tsx`:

- Period: Week/Month/Year + prev/next + swipe.
- Type: Income/Expense only.
- One donut + ranked category list (no drill-down).
- Backed by `useCategoryBreakdown(type, from, to)` only.

Data we can use (already stored per transaction): `type`, `amount`, `fee`,
`categoryId` (parent **or** subcategory), `accountId`, `toAccountId`,
`locationId`, `contactIds` (via `transaction_contacts`), `date`, `note`; plus
account balances and budgets.

## Architecture

### 1. Shared filter model

A single filter object drives every query and chart:

```ts
type StatsFilter = {
  from: Date;
  to: Date;
  period: "week" | "month" | "year" | "custom";
  types: ("income" | "expense" | "transfer")[]; // empty = all
  accountIds: number[]; // empty = all (excl. hidden)
  categoryIds: number[]; // parents and/or subcategories
  locationIds: number[];
  contactIds: number[];
  amountMin?: number;
  amountMax?: number;
  search?: string;
};
```

- Held in a `StatsFilterProvider` (React context) local to the Stats stack, so
  the filter bar, every chart, and a future "drill-down" share one source of
  truth. (Not global app state — keep blast radius small.)
- Phase 3: persist named filters ("saved views") to the settings table.

### 2. Data layer (`transaction-service.ts` + a new `stats-service.ts`)

Add a generic, filter-aware aggregation layer. New functions:

- `queryTransactions(db, userId, filter)` — base filtered fetch (joins
  `transaction_contacts` when `contactIds` set).
- `summary(filter)` → `{ income, expense, transfer, net, count, avgPerTxn }`.
- `breakdownBy(filter, dimension)` where dimension ∈
  `category | subcategory | account | location | person | dayOfWeek` →
  `{ rows: {key, name, color, total, count, pct}[], total }`.
- `timeSeries(filter, bucket)` where bucket ∈ `day | week | month` →
  `{ buckets: {label, income, expense, net}[] }`.
- `balanceSeries(filter)` → cumulative balance per bucket (net worth line).
- `flow(filter)` → Sankey edges: income-category → account, account →
  expense-category (+ transfer edges).
- `budgetVsActual(filter)` → per category {budget, actual} for the period.

All are pure SQL/Drizzle aggregations over the local DB (fast, offline). New
React Query hooks in `use-stats.ts` wrap each, keyed by the serialized filter.

### 3. Charts

- Add **`react-native-gifted-charts`** (pure-JS, renders via the
  `react-native-svg` we already have) → **no native rebuild**. Covers bar, line,
  stacked bar, pie/donut.
- Keep the existing custom `DonutChart` or swap to the lib's — TBD.
- **Sankey, calendar heatmap, treemap** → custom components on
  `react-native-svg` (no lib has good RN Sankey).

### 4. Filter bar UI

- A compact **filter bar** under the period selector showing active filters as
  chips (e.g. "Expense · SBI · Food"). Tapping opens a **filter sheet** (modal)
  with sections: Type, Period (incl. custom range + quick ranges), Accounts
  (multi), Categories (multi, with subcategory drill), Locations, People, Amount
  range, Search. "Reset" + "Apply".
- Charts live in a scrollable dashboard; each chart is a card.

## Phased delivery

### Phase 1 — foundation + core filters + first new charts

Files: `stats/_layout` or provider, `stats-filter-context.tsx`,
`stats-filter-bar.tsx`, `stats-filter-sheet.tsx`, `use-stats.ts`,
`stats-service.ts`, refactor `stats/index.tsx`.

- Filter model + provider + filter bar/sheet.
- Type: add **Transfer** and **All/Net**.
- Period: keep week/month/year, add **custom range** + quick ranges.
- **Account multi-select** filter (exclude hidden by default).
- **Category drill-down**: tap a category → its subcategory breakdown.
- Charts: existing category donut/list (now filter-aware) + **Income-vs-Expense
  bar per bucket** + **Net (savings) line**.
- Summary header cards: income, expense, net, savings rate.

### Phase 2 — money-flow visualizations

- **Sankey**: Income categories → Accounts → Expense categories (custom SVG).
- **Account transfer flow** (ribbons or matrix).
- **Cash-flow waterfall** (opening → +income → −expense → closing).
- **Balance / net-worth line** over time.

### Phase 3 — depth + power features

- **Location** and **People** filters + their ranked bar charts.
- **Calendar heatmap** of daily spend; day-of-week & hour-of-day bars.
- **Treemap** of categories/subcategories; **stacked bars** month-by-month.
- **Budget vs actual** bullet chart.
- **Period-over-period** comparison (Δ vs last period).
- **Saved filter views** (persisted to settings + synced).
- Optional: **global account selector** (RealByte-style) affecting Trans/Stats/
  Accounts — larger, cross-app; decide separately.

## Decisions (settled)

1. **Charts:** SVG-based — `react-native-gifted-charts` + custom SVG for
   Sankey/heatmap/treemap. No native rebuild. Keep chart animations minimal and
   memoize aggressively. Skia (`react-native-skia`/`victory-native`) is the
   higher-performance fallback **only if** we hit jank — accepts a native build.
   The chart lib is not the bottleneck at this app's data scale; aggregation +
   re-renders are, and we control both.
2. **Account filter:** single or **multi-select** accounts only.
   - No "group by asset type" (dropped).
   - No from-account vs to-account split — a selected account matches any
     transaction touching it (source, or destination for transfers).
   - Stats-only scope for now (does not re-scope Trans/Accounts tabs).
3. **Custom date range:** reuse `@react-native-community/datetimepicker` twice
   (from/to).
4. **Performance:** aggregations run on-device over local SQLite; add indexes /
   memoize if volumes grow. Also apply `placeholderData: keepPreviousData` +
   prefetch pattern (see the Transactions swipe fix) to stats queries so period
   changes don't flash.

## Risks

- Scope is large — phases keep it shippable and verifiable on-device at each step.
- Sankey/heatmap are custom SVG — moderate effort; isolate as their own components.
- `react-native-gifted-charts` is JS-only but adding any dep here means the
  wipe + `pnpm install --force` recipe (see PNPM_TROUBLESHOOTING.md); no native
  rebuild though.
