# Debts / lending ledger — implementation plan

Goal: track money you **lend out** and money you **hold for others** (Khatabook
style), keeping a per-person running balance, without polluting income/expense
analytics. Everything in one app instead of a separate Khatabook.

## The two real-world cases

1. **Receivable (you lent):** you give money to a friend/relative/friend-of-a-
   friend; later they return the exact amount. While it's out, **they owe you**.
2. **Payable (you're holding):** someone gives you money to keep safe (so they
   don't waste it); later they take it back. While you hold it, **you owe them**.

Both are the same ledger with opposite signs.

## Core accounting principle (this is what protects the stats)

Lending or holding money is a **balance-sheet move, not income/expense**:

- Lend ₹500: cash −₹500, but a **receivable +₹500** is created. Net worth
  unchanged.
- Hold ₹1000 for a friend: cash +₹1000, but a **payable +₹1000**. Net worth
  unchanged.
- Repayments just reverse the above.

So debt events **must affect account (cash) balances** but **must NOT count as
income, expense, or net**. If we counted lending as an expense, lending ₹10k
would look like you spent ₹10k — wrong.

## Data model (recommended): two debt directions on the transactions table

Reuse the existing `transactions` table rather than a separate ledger table —
it already syncs, already drives account balances, already has dates and notes.

- **New `type` values:** `debt_lend` ("You gave") and `debt_borrow` ("You got").
  `transactions.type` is a plain `text` column (no DB enum/check), so this needs
  **no migration** — only widening the TS unions and the backend zod enum.
- **New column `transactions.contactId`** (nullable int FK → `contacts`): the
  debt counterparty (the person). One additive `ALTER TABLE ADD COLUMN`
  migration, auto-applied by `useMigrations`. (Distinct from the existing
  `transaction_contacts` tag table, which is "people present on a normal txn";
  the debt counterparty is singular and queried heavily, so it gets its own
  indexed scalar column.)
- **Running per-person balance** = Σ(gave) − Σ(got).
  - `> 0` → they owe you (receivable).
  - `< 0` → you owe them (payable).
  This matches Khatabook exactly, handles partial repayments, and handles the
  "hold money" case with no extra concepts. A repayment is **not** linked to a
  specific loan — the running balance is the source of truth.

Alternatives considered:

- **Separate `debts` table.** Cleaner isolation from income/expense, but
  duplicates the whole sync path and forces account-balance + net-worth to
  aggregate across two tables everywhere. Rejected — larger surface area, more
  risk.
- **Four types** (`lend` / `collect` / `borrow` / `repay`) for semantic
  precision ("Collected from Ahmed" vs "Borrowed from Ahmed"). More user
  friction and more enum plumbing. Offered as a decision below; default is the
  2-direction model.

## Schema changes

1. `transactions.type`: allow `"debt_lend" | "debt_borrow"` (shared types,
   mobile types, backend zod). No DB migration.
2. `transactions.contactId` nullable FK → `contacts` + a `contact` relation in
   `relations.ts`. One additive drizzle migration.
3. *(Phase 2, optional)* `transactions.dueDate` nullable timestamp for
   reminders/overdue.

## Balance computation

`account-service.getAccountsWithBalances` (the one place balances are derived)
gains two cases:

- `debt_lend`  → `account −amount` (cash leaves).
- `debt_borrow`→ `account +amount` (cash enters).

Account balances therefore stay exactly right.

## Net worth / Total Assets

- `accountsTotal` = Σ account balances (already moves with debts).
- `receivable` = Σ over contacts of `max(0, gave − got)`.
- `payable`    = Σ over contacts of `max(0, got − gave)`.
- **Net worth = accountsTotal + receivable − payable** — stable across debt
  activity (lending doesn't dip it; holding money doesn't inflate it).

Accounts tab: keep the accounts figure, add a **Debts card** ("Owed to you",
"You owe", "Net"), and surface the true **Net worth** that folds them in.

## Effect on Stats (the explicit ask)

1. **Income / Expense / Net / Savings rate:** debts **excluded**. These
   aggregations already filter by explicit `type === "income"/"expense"`, so
   debt types drop out automatically; we'll audit for any `!== "transfer"`
   assumptions that might leak them in.
2. **Net-worth line:** debt events contribute **0** to the net-worth delta (the
   cash move is offset by the receivable/payable), so lending creates no phantom
   dip. (A genuinely bad debt would later be written off as an explicit expense.)
3. **Cash-flow waterfall:** since cash literally moves, show debt in/out either
   as their own bars or excluded — decided in Phase 2; default is a separate
   "lending" bar so the cash story stays honest.
4. **New "Debts" stats section:** Owed-to-you / You-owe / Net; a per-person
   ranked list (Khatabook-style); a receivable/payable balance trend over time;
   aging/overdue if due dates are added.
5. **Filters:** new Type chips "Lent (gave)" / "Borrowed (got)" to isolate or
   exclude debts. Income/expense charts exclude them by default.

## UI / UX

1. **Add entry:** extend the add-transaction screen with two new modes,
   **"You gave"** and **"You got"**, beside Income/Expense/Transfer. Required:
   Person (contact; quick-add inline), Account (cash out/in), Amount, Date;
   optional Note and (Phase 2) Due date.
2. **Debts ledger screen** (a new **dedicated 5th bottom tab "Debts"** — the
   existing Trans/Stats/Accounts/More stay put; may move under More later if it
   feels crowded): people with a non-zero balance, each showing net owed/owing,
   sorted by magnitude. Tap a person → their **ledger** (chronological gave/got
   with a running balance) + a **"Settle up"** action that prefills the
   offsetting entry to zero them out.
3. **Transactions list:** debt rows render as "→ Ahmed" (gave) / "← Ahmed" (got)
   with a **Debt** tag and neutral (transfer-like) colour, so everything is in
   one place but visually distinct from spending.
4. **Contact detail** unifies with the per-person debt ledger.

## Backend

- Widen the create/update zod `type` enum and accept `contactId`.
- Sync needs no new route (same `transactions` table; the new column rides
  along). Audit any server-side income/expense reporting to confirm exclusion.

## Phasing

- **Phase 1 (core, shippable):** schema (types + `contactId` + migration);
  "You gave/You got" entry modes; balance math; transactions-list display;
  exclusion from income/expense; Debts ledger screen (people list + per-person
  ledger + Settle up); Net worth includes receivable − payable; Stats Debts
  summary card + per-person ranked list.
- **Phase 2 (depth):** receivable/payable trend chart; Type filter chips in
  Stats; cash-flow treatment; due dates + overdue + reminders (notifications);
  smart settle-up prefill.
- **Phase 3 (polish):** share/export a person's ledger (Khatabook parity);
  scheduled reminders; "write off as expense" for bad debt.

## Implementation steps — Phase 1 (file by file, in order)

**0. Types & validation (shared)**
- `packages/shared/src/types.ts`: `transactionTypes = ["income","expense",
  "transfer","debt_lend","debt_borrow"]` (the `TransactionType` union widens
  automatically). Add `DEBT_TYPE_TABS = [{type:"debt_lend",label:"You gave"},
  {type:"debt_borrow",label:"You got"}]` in `constants.ts`. Leave the existing
  `TRANSACTION_TYPE_TABS` (income/expense/transfer) untouched.
- `packages/shared/src/validation/transaction.ts`: widen the `type` enum in
  create/update; add `contactId: z.number().int().positive().nullable()
  .optional()`.

**1. Schema + migration (db)**
- `packages/db/src/schema/transactions.ts`: add `contactId` (nullable FK →
  contacts) + `idx_transactions_contact`.
- `packages/db/src/schema/relations.ts`: add a `contact` relation on
  `transactionsRelations`.
- `pnpm drizzle-kit generate` → new `0002_*.sql` (`ALTER TABLE ADD COLUMN`).
  It rides the existing `useMigrations` journal on next launch (no manual SQL).

**2. Balances, net worth & debt ledger (mobile services)**
- `account-service.ts › getAccountsWithBalances`: add `debt_lend → −amount`,
  `debt_borrow → +amount`. Expose `{ accountsTotal, receivable, payable,
  netWorth }` (or a sibling helper) so net worth = accounts + receivable −
  payable.
- New `services/debt-service.ts`:
  - `getDebtLedger(db,userId)` → per-contact `{contactId,name,gave,got,net}` +
    totals `{receivable,payable,net}`.
  - `getContactDebtEntries(db,userId,contactId)` → chronological entries with a
    running balance (for the per-person ledger + Settle up).

**3. Transaction service**
- `transaction-service.ts`: `createTransaction`/`updateTransaction` accept and
  persist `contactId`; for debt types force `categoryId=null`, `toAccountId=
  null`, `fee=0`. Add `contact: true` to `getTransactions`'s `with` so list rows
  show the person.

**4. Add-entry UI**
- Debts are added from the **Debts tab** (keeps the main `+` to 3 tabs and
  uncluttered). `add-transaction.tsx` accepts a `type` param to preset debt
  mode; in debt mode it shows the **You gave / You got** segment, a **required
  Person** picker (single-select, quick-add inline), an Account (cash out for
  gave / in for got), Amount, Date, Note — and hides category/fee/to-account.

**5. Debts tab (new 5th tab)**
- `app/(app)/(tabs)/debts/_layout.tsx` + `index.tsx`: totals card (Owed to you /
  You owe / Net) + people list with non-zero net (sorted by magnitude, green =
  owes you, red = you owe) + "You gave/You got" actions.
- A per-person **ledger** screen: chronological gave/got with running balance +
  **Settle up** (prefills the offsetting entry for the outstanding amount).
- `(tabs)/_layout.tsx`: add a 5th `<Tabs.Screen name="debts">` with an icon
  (e.g. lucide `HandCoins`). Existing four tabs unchanged.
- `queries/use-debts.ts`: hooks over debt-service.

**6. Transactions list**
- `daily-view.tsx`: debt rows → `→ <person>` (gave) / `← <person>` (got) with a
  **Debt** tag and neutral colour; day income/expense totals already exclude
  debt types.

**7. Stats**
- `stats-service.ts`: audit `summarize`/`breakdownBy`/`timeSeries` to confirm
  debts are excluded (they filter income/expense); make `netWorthSeries` treat
  debt types as **0 delta**; add `debtSummary(filter)` (receivable/payable/net +
  per-person in range).
- `stats-dashboard.tsx`: add a **Debts card** (totals + per-person ranked bar)
  near the Transfers card.

**8. Accounts tab**
- `accounts/index.tsx`: show **Net worth = accounts + owed-to-you − you-owe**
  with a small Debts breakdown; per-account list unchanged.

**9. Backend**
- Widen transaction create/update zod `type` + accept `contactId`; sync needs no
  new route (same table + new column). Confirm no server report miscounts debts.

**10. Seed (temp) + verify**
- Idempotent `dev-seed-debts.ts`: a few gave/got entries across people; run once,
  verify on device (Debts tab, ledger, settle up, stats card, net worth, list
  rows, income/expense untouched), then delete the seeder.

**11. Typecheck clean + commit** per logical chunk (no AI attribution).

## Decisions (settled)

1. **Event model:** 2-direction — **"You gave" / "You got"** with a per-person
   running balance. No loan↔repayment classification.
2. **Net worth:** **fold debts in** — Net worth = accounts + owed-to-you −
   you-owe, with a Debts card showing the breakdown.
3. **Due dates + reminders:** **Phase 2.** Phase 1 has no due dates.
4. **Placement:** a **dedicated 5th bottom tab "Debts"**; leave the existing
   four tabs untouched. Reconsider moving it under More after we live with it.
5. **Storage:** **on the `transactions` table** (debt types + `contactId`), not
   a separate table — confirmed. Reuses sync, balance computation, and unified
   history; revisit only if structured-loan features (interest, schedules,
   repayment→loan linking) are ever needed.
