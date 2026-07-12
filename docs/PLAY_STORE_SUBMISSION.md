# Google Play submission — Shareef Money

Step-by-step to publish, with our real values filled in. Ordered so the
**14-day closed test** (the long pole) starts as early as possible.

> Status as of 2026-07-11: code, build, privacy/terms hosting, and store assets
> are all **ready**. What remains is Play Console configuration + the mandatory
> closed test.

---

## Facts to paste

| Field              | Value                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------- |
| App name           | **Shareef Money**                                                                       |
| Package name       | `com.shareef.money`                                                                     |
| Artifact to upload | Production **`.aab`**, `versionName 1.0.0`, **`versionCode 6`** (EAS, commit `5d5e8ab`) |
| Category           | Finance                                                                                 |
| Content rating     | Everyone (see §6)                                                                       |
| Price              | Free · no ads · no in-app purchases                                                     |
| Privacy Policy URL | `https://money.shareefsolutions.in/privacy`                                             |
| Terms URL          | `https://money.shareefsolutions.in/terms`                                               |
| Support email      | `nadeemshareef934@gmail.com`                                                            |
| Data collection    | **None** — fully on-device (see §5)                                                     |

**Assets** (in `C:\Users\admin\Pictures\shareef-money-marketing\`):

- App icon 512×512 → `play-icon-512.png`
- Feature graphic 1024×500 → `play-feature-graphic-1024x500.png`
- Phone screenshots (use 4–8) → `shareef-transactions-light.png`, `shareef-stats-light.png`,
  `shareef-accounts-light.png`, `shareef-debts-light.png`, `shareef-calendar-light.png`,
  `shareef-year-overview-light.png`, plus the `-dark` variants. All 1080×2408 — valid.

---

## 0. Prerequisites

- [x] Play developer account active.
- [x] Production AAB (versionCode 6) built on EAS.
- [x] Privacy + Terms live (200 OK).
- [x] Store icon + feature graphic + screenshots ready.

## 1. Create the app

Play Console → **Create app** → App name `Shareef Money`, default language
English (India), type **App**, **Free**. Accept the declarations.

## 2. Get the AAB into a testing track

Two ways to upload:

- **`eas submit` (smoothest):** from `apps/mobile/` run `eas submit --platform android`
  and pick the latest **production** build (versionCode 6). Needs a Google Play
  service-account key the first time — or use the interactive flow.
- **Manual:** download the versionCode 6 `.aab` from the Expo dashboard (or
  `eas build:list`) and upload it under **Testing → Closed testing → Create release**.

Upload it to a **Closed testing** track first (not Production) — see §7.

## 3. Main store listing

Store presence → **Main store listing**:

- **App name:** Shareef Money
- **Short description** (≤80 chars) — draft: _"Private, offline money tracker. Your accounts, spending & debts — on-device."_
- **Full description** (≤4000 chars) — draft in §8 (refine or hand to marketing).
- **App icon:** `play-icon-512.png`
- **Feature graphic:** `play-feature-graphic-1024x500.png`
- **Phone screenshots:** upload 4–8 from the list above (min 2 required).

## 4. App content (Policy → App content)

Complete every card:

- **Privacy policy:** `https://money.shareefsolutions.in/privacy`
- **Ads:** No, app does not contain ads.
- **App access:** All functionality available without special access (no login). Note
  the app needs no account.
- **Content rating:** complete questionnaire (§6).
- **Target audience & content:** select age groups (recommend **18+**; app is not
  designed for children — consistent with the privacy policy's "not directed at
  children under 13").
- **News app:** No.
- **Data safety:** §5.
- **Government apps / Financial features / Health:** **Financial features → select
  "My app doesn't have any of these financial features."** Shareef Money is a personal
  budgeting tool — it does **not** offer banking, loans, crypto, investments, or
  payments, and connects to no bank.

## 5. Data safety form (exact answers)

- Does your app collect or share any required user data types? → **No.**
- All data is stored on-device only, never transmitted. No analytics/ads SDKs.
- Data encrypted in transit: N/A (no transmission).
- Users can request deletion: data is removed by uninstalling / clearing storage
  (state this — there's no server-side data to delete).
- Result: a clean "**No data collected**" Data safety label.

## 6. Content rating

Start questionnaire → category **Utility/Productivity/Finance** → answer **No** to
all violence/sexual/drug/gambling/etc. questions. A personal-finance tracker with
user-entered text should land at **Everyone / PEGI 3**.

## 7. Closed testing — the 14-day gate (start this FIRST)

New personal developer accounts must run **closed testing with ≥12 testers who
opt in and stay for ≥14 continuous days** before production access is granted.

- Testing → **Closed testing** → create/choose a track → create release with the AAB.
- Add a tester list of **≥12 email accounts** (they must each accept the opt-in link
  and install). Real, distinct Google accounts.
- Roll out the closed release; confirm testers install and stay enrolled 14 days.
- Fill **Countries/regions** for the track.

## 8. Draft full description (refine or replace)

> **Shareef Money — private, on-device money tracking.**
>
> Track income, expenses, transfers, accounts, and debts — all stored only on your
> phone. No account. No sign-up. No cloud. No tracking. No ads.
>
> • **Fast entry** — a quick numeric keypad, categories, notes, dates.
> • **Accounts** — multiple accounts with live balances and net worth.
> • **Stats** — monthly and yearly breakdowns, savings rate, category charts.
> • **Debts** — track what you lent and borrowed, with due dates.
> • **Recurring** — automate rent, salary, subscriptions.
> • **Tags** — people and places on any transaction.
> • **Backup** — export everything to a file you control; restore anytime.
>
> Your money data never leaves your device unless you export it yourself.
> Quiet, precise, and built to respect your privacy.

## 9. Pricing & distribution

Free; select countries (India + wherever you want). Confirm no ads, comply with
US export laws, content guidelines.

## 10. Submit → review → promote

- Submit the closed-testing release for review (review usually hours–days).
- Run the **14-day** test with your 12+ testers.
- After 14 days: Play Console surfaces **"Apply for production access."** Complete it.
- Create a **Production** release with the same AAB (or a newer versionCode) → roll out.

---

### Quick status checklist

- [x] AAB versionCode 6 built
- [x] Privacy + Terms hosted
- [x] Icon 512 + feature graphic 1024×500
- [x] Screenshots (10)
- [ ] App created in Play Console
- [ ] Store listing filled
- [ ] App content (privacy, ads, data safety, rating, audience, financial features)
- [ ] 12+ testers added, closed test live
- [ ] 14-day test elapsed → production access → publish
