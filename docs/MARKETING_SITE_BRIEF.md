# Shareef Money — Marketing Website Brief

> Hand this whole document to the agent building the site. It is self-contained:
> product context, brand, design direction, the exact color system, the real logo
> (as SVG), page structure, copy direction, and drop-in legal content.

---

## 0. The job, in one line

Build an **elegant, premium, unique** marketing website for **Shareef Money** (a
privacy-first personal-finance app), hosted at **`money.shareefsolutions.in`**,
that also serves the **`/privacy`** and **`/terms`** pages Google Play requires.

- **Stack:** Astro + Cloudflare Pages (this lives in the `shareefsolutions` repo,
  same setup as the agency site at `shareefsolutions.in`).
- **Deliverables:** a landing page, `/privacy`, `/terms`, favicon, OG image.
- **Non-negotiables:** self-hosted fonts (no third-party font CDN — see §9), fast
  static output, light **and** dark themes, fully responsive, accessible.
- **The Play blocker:** `https://money.shareefsolutions.in/privacy` must be live.

---

## 1. What Shareef Money is (product context)

A **premium personal-finance app for Android** (iOS later). The whole pitch is
**local-first + privacy-first**: your money data lives **only on your device** —
**no account, no sign-up, no cloud, no tracking, no ads**. It never leaves the
phone unless the user exports a backup themselves.

**What it does (real, shipped features):**
- **Transactions** — income, expense, and transfers, with a fast numeric keypad,
  date/time, notes, and quick "continue" entry.
- **Accounts** — multiple accounts with live balances; account statements/history.
- **Categories & subcategories** — customizable, colour-coded, drag-to-reorder.
- **Budgets** — per-category budgets with progress vs. actual.
- **Recurring** — daily/weekly/monthly/yearly rules that auto-post transactions.
- **Debts & ledger** — track money you **lent** or **borrowed**, per person, with
  settle-up and due-date reminders.
- **Tags** — attach **people** (contacts) and **locations** to any transaction.
- **Stats dashboard** — rich charts: category breakdown, income vs expense, net
  flow, net worth over time, calendar heatmap, day-of-week, cash-flow, and more.
- **Currency** — single currency by ISO code (₹ INR default), fully configurable.
- **Security** — passcode + biometric app lock; brute-force lockout.
- **Backup** — full export to a file and restore (the user's data, in their hands).

**Positioning:** calm, trustworthy, wealth-building, made for people who want real
control of their money **without surveillance**. It is *quiet premium* — crafted,
engineered, precise. **Not** loud fintech, not gamified, not hype.

**Audience:** thoughtful people who value privacy and craft — the kind who use
Notion, Obsidian, Arc, Things 3. They notice typography and motion. They distrust
apps that harvest data.

**Voice/tone:** calm, confident, precise, understated. Short sentences. No
exclamation-mark energy, no "revolutionary," no growth-hacky urgency. Let the
privacy promise and the craft speak. Think Linear/Things 3 copy, not a crypto ad.

---

## 2. Brand identity

**Name:** Shareef Money. (Always "Shareef Money," not "ShareefMoney.")

**The mark — a custom infinity.** It is a hand-built *cross-lemniscate* (two loops
crossing at the centre) — **not** the typographic ∞ and not two overlapping
circles. It reads as **infinity** and carries the brand meaning: **long-term
thinking, continuous compounding, and a private loop that never leaves your
hands.** Ivory stroke on deep ink. Timeless, engineered, elegant — never playful.

**Use the exact mark (do not redraw it).** Full vector in §7. Rules:
- On **dark/ink** surfaces: ivory stroke `#EEE9DC`.
- On **light/cream** surfaces: ink stroke `#141C31`.
- Keep the round line-caps and the soft right-loop asymmetry — that asymmetry is
  deliberate and is what makes it feel bespoke rather than generic.
- Clear space ≈ one loop-height on all sides. Never recolour to a gradient, never
  add a drop shadow, never squash the aspect ratio.

**Signature idea:** the crossing point of the infinity is the brand's "still
centre." Motion, layout focal points, and the favicon can all lean on it.

---

## 3. Design direction — elegant, premium, unique, smooth

Benchmark quality bar: **Linear, Arc, Notion, Things 3, Stripe** — sites where
restraint *is* the premium signal. Make deliberate, specific choices; avoid
anything that looks like a template.

**The core aesthetic: "paper & ink."** The signature is a **warm** duotone world —
**cream/ivory** paper and **deep ink** — with a single confident blue accent. This
warmth is what separates it from cold, generic fintech blue-on-stark-white. Lean
into it. The app itself uses a warm cream in light mode and a deep surface in dark
mode; the site should feel like the same world, a touch more premium and spacious.

**Principles:**
- **Whitespace is the luxury.** Generous margins, unhurried vertical rhythm, a
  tight and consistent type scale. Let sections breathe.
- **Typography carries it** (see §4). Big, balanced, confident headings; calm body
  at ~60–70 characters per line; small uppercase labels with letter-spacing.
- **One accent, used sparingly.** Ink + ivory do 90% of the work; the blue
  `#2F80D8` is the punctuation (links, primary buttons, the odd highlighted word).
  Coral and orange appear only in tiny doses (e.g. an "expense" figure in a demo).
- **Motion, tasteful and smooth.** A quiet page-load reveal; scroll-triggered
  fades/rises for sections; hover micro-interactions on cards/buttons. **One**
  signature moment: the infinity mark **draws itself on** (stroke-dashoffset
  animation) on first load, and/or breathes very slowly. Respect
  `prefers-reduced-motion` — cut animation to simple fades when set.
- **Real content, not lorem.** Use the features and copy in this brief. If you
  show the app, use tasteful device mockups (ink frame) with real-looking data —
  ideally the actual screenshots (ask for them; placeholders otherwise, clearly
  marked).
- **Depth without noise.** Soft, low-contrast elevation (a faint border + a barely
  perceptible shadow), rounded corners in the 12–20px range to echo the app's card
  radius and the icon's `rx=22`. No heavy borders, no neon glows.

**Avoid (these read as generic / AI-generated):** purple→blue hero gradients;
emoji as section bullets; everything centered; a giant flashy hero with no
substance; the "cream + serif + terracotta" template look (we use cream, but keep
type modern and the accent blue, not terracotta); stock 3D blobs; carousels.

---

## 4. Typography

Pick a **modern, refined** pairing — the brand is "engineered & calm," so lead with
a clean grotesque, not a decorative serif (a serif-heavy treatment would drift into
the generic warm-cream cliché). **Self-host every font** (§9).

**Recommended (safe, premium, self-hostable — all have open licenses):**
- **Display / headings:** *General Sans* (Fontshare) — or *Geist* — tight, modern,
  quietly premium. Use tighter tracking and weights 500–600 for big headings.
- **Body:** *Inter* — or *Geist* — 400/500, excellent legibility, tabular numbers
  available (use `font-variant-numeric: tabular-nums` anywhere digits align).
- **Labels / eyebrows / small technical bits (optional):** a mono such as *Geist
  Mono* or *IBM Plex Mono*, uppercase, letter-spaced — reinforces "engineered."

If you prefer one warm serif accent for a single hero word, *Fraunces* (optical
display) is acceptable **used once**, but keep everything else grotesque.

Set a clear type scale (e.g. 12 / 14 / 16 / 20 / 28 / 40 / 64) and stick to it.
Headings get `text-wrap: balance`.

---

## 5. Color system — EXACT values (match the app)

Use these hex values verbatim so the site and app feel like one product. Two layers:
**brand colors** (the premium identity — anchor the site on these) and the **app
UI tokens** (so any app-like UI on the site matches pixel-for-pixel).

### 5a. Brand core (anchor the whole site on these)
| Token | Hex | Use |
|---|---|---|
| **Ink** | `#141C31` | The signature deep navy-ink. Dark sections, footer, logo bg, device frames, dark-theme background. |
| **Ivory** | `#EEE9DC` | The signature warm off-white. Logo stroke on ink; text/marks on ink. |
| **Cream (paper)** | `#FAF6EC` | Light-theme page background (the app's real light bg). |
| **Blue accent** | `#2F80D8` | Primary actions, links, focus, highlights. The one accent. |

### 5b. App LIGHT theme tokens (site's light mode)
| Token | Hex |
|---|---|
| background | `#FAF6EC` |
| card | `#F2EBDB` |
| card-alt | `#E9E0CD` |
| surface | `#FFFFFF` |
| text | `#26262A` |
| text-secondary | `#79736A` |
| text-muted | `#ABA493` |
| border | `#E8DFCD` |
| divider | `#EFE8D8` |
| primary / link / info / success | `#2F80D8` |
| expense / error | `#E0534C` |
| transfer | `#6B7280` |
| FAB / energy accent | `#F2663B` |
| warning | `#D97706` |

### 5c. App DARK theme tokens (site's dark mode)
| Token | Hex |
|---|---|
| background | `#121212` *(for exact app parity)* — **but for the site, prefer brand Ink `#141C31`** as the dark background; it's warmer and more premium. Use `#121212`/`#1E1E1E` only if you want literal app parity. |
| card | `#1E1E1E` (or a lifted ink `#1B2338`) |
| surface | `#181818` |
| text | `#ECECEC` |
| text-secondary | `#A0A0A0` |
| text-muted | `#6B6B6B` |
| border | `#2E2E2E` (or `#26314C` on ink) |
| primary / link | `#5AA0F0` (lighter blue for dark bg) |
| expense / error | `#F2706A` |
| transfer | `#9CA3AF` |
| FAB / energy accent | `#F2663B` |

### 5d. Data-viz palette (if you show charts/stat demos)
`#2F80D8`, `#E0534C`, `#E8A33D`, `#3FB68B`, `#9B6FD4`, `#E06FA8`, `#5BB0C9`,
`#C9883D`, `#7A8B9A`, `#8FB339`, `#D96E4B`, `#5C6BC0`.

**Guidance:** keep the page overwhelmingly ink + ivory/cream. Blue is the accent.
Coral/orange/teal only appear in small "product" moments (a demo expense figure, a
tiny chart). Ensure AA contrast in both themes; the theme toggle must override the
media query in both directions.

---

## 6. Site structure & content

Single elegant landing page (long-scroll) plus two legal pages. Sections:

1. **Nav** — small ivory infinity mark + "Shareef Money" wordmark left; light/dark
   toggle + a "Get it on Google Play" button right (button can say **"Coming to
   Google Play"** until the store link is live). Sticky, minimal, transparent→solid
   on scroll.
2. **Hero** — the thesis. Headline about owning your money privately; one-line
   subhead; primary CTA + a secondary "See how it works." A tasteful device mockup
   (ink frame) showing the app, or the animated infinity mark as the focal art.
3. **The privacy promise** (the centerpiece — this is the differentiator). A calm,
   confident statement: *no account, no cloud, no tracking, no ads; your data never
   leaves your phone.* Back it with 3–4 concrete points (on-device database, you
   own the backup file, biometric lock, zero analytics SDKs).
4. **Features** — a considered grid/list of the real features (§1). Group them:
   *Track* (transactions, accounts, categories), *Understand* (stats, budgets,
   net worth), *Stay on top* (recurring, debts & ledger, reminders), *Yours alone*
   (local-first, backup, lock). Each with a crisp title + one-sentence blurb + a
   small line-icon (draw simple, consistent 1.5px line icons; don't use an emoji).
5. **How it works** — 3 steps: *Add an account → Log money as it moves → See where
   it goes.* Emphasize speed and calm.
6. **Show the app** — 2–4 real screenshots in ink device frames (light + dark), or
   a subtle scroll-through. Mark clearly if placeholders.
7. **FAQ** — is my data really private? does it work offline? is it free? do I need
   an account? how do I move to a new phone (backup/restore)? iOS?
8. **Final CTA** — repeat the download button on an ink band with the infinity mark.
9. **Footer** — infinity mark, © Shareef Money, links to **Privacy** and **Terms**,
   contact email `nadeemshareef934@gmail.com`, and a link back to
   `shareefsolutions.in`.

**Legal pages:** `/privacy` (content in §10, ready to paste) and `/terms` (skeleton
in §11). Give them the same header/footer, a max-width readable column (~680px),
clear headings, and a "Last updated" date.

---

## 7. The logo — exact vector (use as-is)

viewBox is `0 0 100 100`. This is the canonical mark; **embed it, don't approximate.**

**Mark only (transparent bg) — ivory on dark:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Shareef Money">
  <path d="M50 50 C62 25 83.17 25 83.17 50 C83.17 75 62 75 50 50 C38 25 19 25 19 50 C19 75 38 75 50 50 Z"
        fill="none" stroke="#EEE9DC" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```
- On **light/cream** surfaces, change `stroke` to `#141C31`.

**App icon lockup (ink rounded square + ivory mark)** — for the OG image, favicon,
and any "app icon" moment:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#141C31"/>
  <path d="M50 50 C62 25 83.17 25 83.17 50 C83.17 75 62 75 50 50 C38 25 19 25 19 50 C19 75 38 75 50 50 Z"
        fill="none" stroke="#EEE9DC" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Draw-on animation (optional signature):** animate `stroke-dashoffset` from the
path length to 0 over ~1.2s ease-out on load; optionally a very slow, subtle
"breathing" (opacity/scale ±1%) loop after. Disable under `prefers-reduced-motion`.

---

## 8. SEO / meta / assets

- **Title:** `Shareef Money — Private, local-first money tracking`
- **Meta description:** `Track your money privately. Shareef Money keeps every
  transaction on your device — no account, no cloud, no tracking. A calm, premium
  personal-finance app for Android.`
- **Favicon:** the ink app-icon lockup (§7). Provide 32/180/512 PNG + SVG.
- **OG/Twitter image (1200×630):** ink `#141C31` background, ivory infinity mark,
  the wordmark "Shareef Money," and the tagline. Keep it minimal and premium.
- **Domain:** `money.shareefsolutions.in`. Set Astro `site` accordingly for correct
  canonical/OG URLs.
- Add a small JSON-LD `SoftwareApplication` block (name, OS Android, category
  Finance, offers free).

---

## 9. Technical constraints

- **Astro, static output, Cloudflare Pages.** Ship near-zero JS; use Astro islands
  only for the theme toggle and any scroll animation. Inline critical CSS.
- **Self-host all fonts** (woff2 in the repo, `@font-face`). Do **not** load Google
  Fonts / any font CDN — a privacy-first brand must not leak visitors to a third
  party, and it's faster. Same for analytics: **none**, or a privacy-respecting,
  cookieless one (e.g. Cloudflare Web Analytics) — nothing that profiles visitors.
- **Theme:** default to `prefers-color-scheme`, plus a manual toggle that stamps
  `data-theme="dark|light"` on `<html>` and overrides the media query both ways.
  Persist the choice in `localStorage`. No flash of wrong theme (inline the
  theme-set script in `<head>`).
- **Responsive:** mobile-first; wide elements (any table/chart/screenshot row) get
  their own `overflow-x:auto`; the page body never scrolls sideways.
- **A11y:** semantic landmarks, visible focus states, alt text, AA contrast in both
  themes, keyboard-operable toggle and nav.
- **Perf target:** Lighthouse 95+ across the board; no layout shift; lazy-load
  below-the-fold images.

---

## 10. Privacy policy — drop-in content for `/privacy`

Accurate to the current **local-only, no-data-collection** app. Paste as the page
body; keep the "Last updated" line. (Update it if/when cloud sync is added later.)

> **Shareef Money — Privacy Policy**
> _Last updated: 5 July 2026_
>
> Shareef Money is an offline, on-device personal finance app. We do not collect,
> transmit, store on our servers, or share any of your personal or financial data.
> The app has no user accounts and does not connect to any backend.
>
> Data you enter — transactions, accounts, categories, budgets, contacts, and
> settings — is stored only in the app's local database on your device. It never
> leaves your device unless you explicitly export it.
>
> **Backups.** You can export your data to a file and save/share it wherever you
> choose (Google Drive, email, …). These exports are fully under your control; we
> never receive or access them.
>
> **Permissions.** Optional biometric/PIN unlock uses your device's security only.
> File access is used solely when you choose to export or import a backup.
>
> **No tracking.** No analytics, no advertising, no third-party data-collection SDKs.
>
> **Deleting your data.** Uninstalling the app or clearing its storage permanently
> removes all data on the device — export a backup first to keep it.
>
> **Children.** Not directed at children under 13.
>
> **Changes.** We may update this policy; changes will be posted on this page.
>
> **Contact:** nadeemshareef934@gmail.com

---

## 11. Terms of Service — skeleton for `/terms`

Draft a simple, plain-English ToS (this is a free, on-device app — keep it short).
Suggested sections:
- **Acceptance** — using the app means accepting these terms.
- **The service** — Shareef Money is provided free, as-is, for personal money
  tracking; it runs entirely on your device.
- **Your data & responsibility** — your data lives on your device; you are
  responsible for keeping backups; we can't recover data we never have.
- **No warranty** — provided "as is," without warranties; not financial advice.
- **Limitation of liability** — to the extent permitted by law.
- **Changes** — terms may be updated; continued use means acceptance.
- **Contact** — nadeemshareef934@gmail.com.
_(Have a human review before relying on it legally.)_

---

## 12. Handoff checklist

- [ ] Landing page built to the design direction above (light + dark, responsive).
- [ ] `/privacy` live with §10 content → this is the URL for Google Play.
- [ ] `/terms` live with §11.
- [ ] Exact colors from §5; exact logo from §7; self-hosted fonts from §4/§9.
- [ ] Favicon + OG image from §7/§8.
- [ ] `money.shareefsolutions.in` custom domain on the Cloudflare Pages project.
- [ ] Lighthouse 95+, no third-party font/analytics calls.
- [ ] App screenshots requested (or placeholders clearly marked).
```
