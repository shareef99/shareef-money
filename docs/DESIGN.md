# Shareef Money — Mobile Design System

## 1. Color Palette

### 1.1 Semantic Colors (Transaction Types)

| Token      | Light     | Dark      | Usage                                 |
| ---------- | --------- | --------- | ------------------------------------- |
| `income`   | `#16A34A` | `#4ADE80` | Income amounts, income indicators     |
| `expense`  | `#DC2626` | `#F87171` | Expense amounts, expense indicators   |
| `transfer` | `#2563EB` | `#60A5FA` | Transfer amounts, transfer indicators |

### 1.2 Brand / Accent

| Token               | Light     | Dark      | Usage                              |
| ------------------- | --------- | --------- | ---------------------------------- |
| `primary`           | `#2563EB` | `#3B82F6` | Active tab, primary buttons, links |
| `primaryForeground` | `#FFFFFF` | `#FFFFFF` | Text on primary buttons            |

### 1.3 Backgrounds

| Token        | Light     | Dark      | Usage                                      |
| ------------ | --------- | --------- | ------------------------------------------ |
| `background` | `#FFFFFF` | `#0A0A0A` | Main screen background                     |
| `card`       | `#F4F4F5` | `#18181B` | Cards, elevated surfaces, list sections    |
| `cardAlt`    | `#E4E4E7` | `#27272A` | Nested cards, alternate rows               |
| `surface`    | `#FAFAFA` | `#111111` | Subtle surface (modal backgrounds, sheets) |

### 1.4 Text

| Token           | Light     | Dark      | Usage                                |
| --------------- | --------- | --------- | ------------------------------------ |
| `text`          | `#09090B` | `#FAFAFA` | Primary text, headings               |
| `textSecondary` | `#71717A` | `#A1A1AA` | Labels, descriptions, secondary info |
| `textMuted`     | `#A1A1AA` | `#52525B` | Placeholders, disabled text          |

### 1.5 Borders & Dividers

| Token     | Light     | Dark      | Usage                             |
| --------- | --------- | --------- | --------------------------------- |
| `border`  | `#E4E4E7` | `#27272A` | Card borders, input borders       |
| `divider` | `#F4F4F5` | `#1C1C1E` | List dividers, section separators |

### 1.6 Status & Feedback

| Token     | Light     | Dark      | Usage                         |
| --------- | --------- | --------- | ----------------------------- |
| `success` | `#16A34A` | `#4ADE80` | Success states, confirmations |
| `warning` | `#D97706` | `#FBBF24` | Warnings, caution states      |
| `error`   | `#DC2626` | `#F87171` | Errors, destructive actions   |
| `info`    | `#2563EB` | `#60A5FA` | Informational states          |

### 1.7 FAB (Floating Action Button)

| Token           | Light     | Dark      | Usage                                               |
| --------------- | --------- | --------- | --------------------------------------------------- |
| `fab`           | `#F97316` | `#F97316` | FAB background (orange — stands out on both themes) |
| `fabForeground` | `#FFFFFF` | `#FFFFFF` | FAB icon color                                      |

### 1.8 Tab Bar

| Token          | Light     | Dark      | Usage                     |
| -------------- | --------- | --------- | ------------------------- |
| `tabBar`       | `#FFFFFF` | `#0A0A0A` | Tab bar background        |
| `tabBarBorder` | `#E4E4E7` | `#27272A` | Tab bar top border        |
| `tabActive`    | `#2563EB` | `#3B82F6` | Active tab icon + label   |
| `tabInactive`  | `#71717A` | `#52525B` | Inactive tab icon + label |

### 1.9 Stats / Chart Colors

Predefined palette for pie chart slices and category badges. Ordered for maximum visual distinction.

```bash
chartColors: [
  "#F87171",  // red
  "#FB923C",  // orange
  "#FBBF24",  // amber
  "#4ADE80",  // green
  "#2DD4BF",  // teal
  "#60A5FA",  // blue
  "#A78BFA",  // violet
  "#F472B6",  // pink
  "#94A3B8",  // slate
  "#FCD34D",  // yellow
]
```

---

## 2. Typography

Using system fonts for performance and native feel. NativeWind + Tailwind CSS v4 utilities.

### 2.1 Scale

| Name           | Size | Weight         | Line Height | Usage                                   |
| -------------- | ---- | -------------- | ----------- | --------------------------------------- |
| `displayLarge` | 32px | 700 (bold)     | 40px        | Large balance amounts on account screen |
| `displaySmall` | 24px | 600 (semibold) | 32px        | Screen titles, total amounts            |
| `headingLarge` | 20px | 600 (semibold) | 28px        | Section headers (e.g., "Aug 2025")      |
| `headingSmall` | 17px | 600 (semibold) | 24px        | Card titles, date group headers         |
| `bodyLarge`    | 16px | 400 (regular)  | 24px        | Primary body text, form labels          |
| `body`         | 14px | 400 (regular)  | 20px        | Default body text, list items           |
| `bodySmall`    | 12px | 400 (regular)  | 16px        | Secondary text, timestamps, captions    |
| `label`        | 13px | 500 (medium)   | 18px        | Form labels, badge text, tab labels     |
| `caption`      | 11px | 400 (regular)  | 14px        | Tiny annotations, chart labels          |

### 2.2 Tailwind Classes Mapping

```bash
displayLarge  → text-3xl font-bold
displaySmall  → text-2xl font-semibold
headingLarge  → text-xl font-semibold
headingSmall  → text-[17px] font-semibold
bodyLarge     → text-base font-normal
body          → text-sm font-normal
bodySmall     → text-xs font-normal
label         → text-[13px] font-medium
caption       → text-[11px] font-normal
```

### 2.3 Amount Typography

Currency amounts get special treatment:

- **Income amounts**: `font-semibold` + `text-income` (green)
- **Expense amounts**: `font-semibold` + `text-expense` (red)
- **Transfer amounts**: `font-semibold` + `text-transfer` (blue)
- **Neutral amounts** (totals): `font-semibold` + `text-text`

---

## 3. Spacing

Using Tailwind's default 4px-based spacing scale. Standard spacing tokens used throughout:

| Token | Value        | Usage                                   |
| ----- | ------------ | --------------------------------------- |
| `xs`  | 4px (`p-1`)  | Tight internal padding (badges)         |
| `sm`  | 8px (`p-2`)  | Icon-to-text gap, compact spacing       |
| `md`  | 12px (`p-3`) | Default gap between elements            |
| `lg`  | 16px (`p-4`) | Screen horizontal padding, card padding |
| `xl`  | 20px (`p-5`) | Section spacing                         |
| `2xl` | 24px (`p-6`) | Large section gaps                      |
| `3xl` | 32px (`p-8`) | Screen top/bottom padding               |

### 3.1 Screen Layout

- **Horizontal padding**: 16px (`px-4`) — consistent on all screens
- **Section gap**: 24px (`gap-6`) — between major sections
- **List item vertical padding**: 12px (`py-3`) — each row
- **Card internal padding**: 16px (`p-4`)

---

## 4. Border Radius

| Token  | Value                   | Usage                                       |
| ------ | ----------------------- | ------------------------------------------- |
| `none` | 0px                     | No rounding (dividers, full-width elements) |
| `sm`   | 6px (`rounded-md`)      | Small badges, percentage pills              |
| `md`   | 8px (`rounded-lg`)      | Inputs, small cards                         |
| `lg`   | 12px (`rounded-xl`)     | Cards, modals, sheets                       |
| `xl`   | 16px (`rounded-2xl`)    | Large cards, bottom sheets                  |
| `full` | 9999px (`rounded-full`) | FAB, avatar, circular badges                |

---

## 5. Component Patterns

### 5.1 Buttons

#### **Primary Button (Save, Confirm)**

- Background: `bg-primary`
- Text: `text-primaryForeground font-semibold`
- Radius: `rounded-lg` (8px)
- Height: 48px (`h-12`)
- Full width in forms
- Pressed state: `opacity-80`

#### **Secondary Button (Continue, Cancel)**

- Background: `bg-card`
- Text: `text-text font-semibold`
- Border: `border border-border`
- Radius: `rounded-lg`
- Height: 48px

#### **Destructive Button (Delete)**

- Background: `bg-error`
- Text: `text-white font-semibold`
- Radius: `rounded-lg`
- Height: 48px

#### **Ghost Button (filter tags, subtle actions)**

- Background: transparent
- Text: `text-primary`
- No border
- Pressed state: `bg-card`

#### **Icon Button (header actions)**

- Size: 40px x 40px
- Background: transparent
- Icon: 24px, `text-text`
- Pressed state: `bg-card rounded-full`

### 5.2 Segmented Control (Income / Expense / Transfer)

- Container: `bg-card rounded-lg` with 4px padding
- Segments: equal width
- Active segment: `bg-background rounded-md` with shadow
- Active text: `text-text font-semibold`
- Inactive text: `text-textSecondary font-medium`
- Height: 40px
- Active segment for Expense: border `border-expense` (red accent)
- Active segment for Income: border `border-income` (green accent)
- Active segment for Transfer: border `border-transfer` (blue accent)

### 5.3 Top Tabs (Daily / Calendar / Monthly / Total)

- Container: full width, bottom border
- Active tab: `text-text font-semibold`, underline `border-b-2 border-primary`
- Inactive tab: `text-textSecondary font-normal`
- Height: 44px
- Scrollable if needed

### 5.4 Bottom Tab Bar

- Background: `bg-tabBar`
- Top border: `border-t border-tabBarBorder`
- Height: 56px + safe area inset
- Active: icon + label in `text-tabActive`
- Inactive: icon + label in `text-tabInactive`
- Icon size: 24px
- Label: `caption` (11px)
- 4 tabs: Trans. | Stats | Accounts | More

### 5.5 FAB (Floating Action Button)

- Size: 56px x 56px
- Background: `bg-fab` (orange `#F97316`)
- Icon: `+` in white, 28px
- Radius: `rounded-full`
- Position: bottom-right, 16px from edges, above tab bar
- Shadow: `shadow-lg`

### 5.6 Cards / List Sections

- Background: `bg-card`
- Radius: `rounded-xl` (12px)
- Padding: 16px
- No border in dark mode, subtle `border-border` in light mode

### 5.7 List Items (Transaction Rows)

- Height: auto, min 52px
- Padding: `py-3 px-4`
- Left side: category icon (emoji, 20px) + category name + subcategory
- Right side: amount (colored by type)
- Divider: `border-b border-divider` (1px, subtle)
- Pressed state: `bg-cardAlt`

### 5.8 Date Group Headers

- Background: transparent
- Layout: `day number` (bold, large) + `day name` + `date` on left, `income` + `expense` on right
- Font: `headingSmall` for day number, `bodySmall` for date/day name
- Bottom border below header

### 5.9 Summary Bar (Income / Expenses / Total)

- Layout: 3 columns, evenly spaced
- Label: `bodySmall text-textSecondary` ("Income", "Expenses", "Total")
- Value: `body font-semibold` with semantic color (income=green, expense=red, total=default)
- Background: `bg-card`
- Padding: `py-3 px-4`

### 5.10 Inputs

**Text Input**

- Height: 48px
- Background: transparent (form style, not boxed)
- Bottom border: `border-b border-border`
- Focus border: `border-b-2 border-primary`
- Label: `text-textSecondary bodySmall`, positioned above
- Value: `text-text bodyLarge`
- Placeholder: `text-textMuted`
- Expense amount input: focus border is `border-expense` (red)
- Income amount input: focus border is `border-income` (green)
- Transfer amount input: focus border is `border-transfer` (blue)

**Picker / Dropdown**

- Same as text input but with chevron-right icon on right side
- Tappable → opens modal/sheet

### 5.11 Modals / Bottom Sheets

- Background: `bg-surface`
- Top radius: `rounded-t-2xl` (16px)
- Handle bar: 36px wide, 4px tall, `bg-textMuted`, centered, `mt-2`
- Content padding: `px-4 pt-4 pb-safe`

### 5.12 Numeric Keypad

- Background: `bg-card`
- Keys: 4 columns x 4 rows
- Key size: flexible, full width divided by 4
- Key text: `headingLarge font-semibold`
- Pressed state: `bg-cardAlt`
- Done button: `text-primary font-bold`
- Backspace: icon, same size as text

### 5.13 Percentage Badge (Stats)

- Size: auto, min-width 40px
- Background: category color at 20% opacity
- Text: category color, `label font-semibold`
- Radius: `rounded-md` (6px)
- Padding: `px-2 py-0.5`

### 5.14 Pie Chart

- Size: 240px x 240px centered
- Labels: outside the chart, connected by thin lines
- Label text: `caption` with category name + percentage
- Colors: from `chartColors` array, matched to categories

### 5.15 Dropdown Menu (Account options, Period selector)

- Background: `bg-card`
- Radius: `rounded-lg`
- Shadow: `shadow-xl`
- Item height: 48px
- Item text: `body`
- Pressed state: `bg-cardAlt`
- Divider between items: `border-b border-divider`

### 5.16 Checkbox (Filter categories)

- Size: 20px x 20px
- Unchecked: `border-2 border-border rounded-sm` with transparent fill
- Checked: `bg-primary rounded-sm` with white checkmark icon
- Label: `body`, next to checkbox with 8px gap

### 5.17 Toggle / Switch (Settings)

- Track: 48px x 28px
- Off: `bg-cardAlt`
- On: `bg-primary`
- Thumb: 24px white circle with subtle shadow

---

## 6. Shadows

| Token | Value       | Usage                                  |
| ----- | ----------- | -------------------------------------- |
| `sm`  | `shadow-sm` | Subtle elevation (cards in light mode) |
| `md`  | `shadow-md` | Modals, floating elements              |
| `lg`  | `shadow-lg` | FAB, dropdowns                         |

In dark mode, shadows are less visible. Use border + background color difference for elevation instead.

---

## 7. Animation & Transitions

- **Screen transitions**: Use expo-router default stack/tab animations
- **Tab switching**: 200ms ease-out
- **Button press**: `opacity-80` on press down, instant release
- **Modal open**: slide-up with spring (damping: 20, stiffness: 300)
- **List item press**: `bg-cardAlt` on press, immediate
- **Numeric keypad key press**: `bg-cardAlt` for 100ms

---

## 8. Safe Areas & Layout Constants

| Constant                  | Value                   | Usage                |
| ------------------------- | ----------------------- | -------------------- |
| Tab bar height            | 56px + bottom safe area | Bottom tab navigator |
| Header height             | 56px + top safe area    | Screen headers       |
| FAB bottom offset         | 16px above tab bar      | FAB positioning      |
| Screen horizontal padding | 16px                    | All screens          |
| Modal max height          | 90% of screen           | Bottom sheets        |
| Numeric keypad height     | ~280px                  | Amount input keypad  |

---

## 9. Icon Specifications

**Library**: Lucide Icons (`lucide-react-native`)

| Context           | Size                   | Stroke Width |
| ----------------- | ---------------------- | ------------ |
| Tab bar           | 24px                   | 1.5px        |
| Header actions    | 24px                   | 2px          |
| List item leading | 20px                   | 1.5px        |
| Button inline     | 18px                   | 2px          |
| FAB               | 28px                   | 2.5px        |
| Empty state       | 48px                   | 1px          |
| Category icons    | Emoji (20px font size) | —            |

---

## 10. NativeWind / Tailwind Configuration

All design tokens should be defined in `global.css` using Tailwind CSS v4's `@theme` directive:

```css
@theme {
  /* Semantic transaction colors */
  --color-income: #16a34a;
  --color-expense: #dc2626;
  --color-transfer: #2563eb;

  /* Brand */
  --color-primary: #2563eb;
  --color-primary-foreground: #ffffff;

  /* FAB */
  --color-fab: #f97316;
  --color-fab-foreground: #ffffff;

  /* Shadows (light mode only, dark mode uses borders) */
}
```

Dark/light theme colors are defined using CSS variables in `:root` and `.dark`:

```css
:root {
  --color-background: #ffffff;
  --color-card: #f4f4f5;
  --color-card-alt: #e4e4e7;
  --color-surface: #fafafa;
  --color-text: #09090b;
  --color-text-secondary: #71717a;
  --color-text-muted: #a1a1aa;
  --color-border: #e4e4e7;
  --color-divider: #f4f4f5;
  --color-tab-bar: #ffffff;
  --color-tab-bar-border: #e4e4e7;
  --color-tab-active: #2563eb;
  --color-tab-inactive: #71717a;
}

.dark {
  --color-background: #0a0a0a;
  --color-card: #18181b;
  --color-card-alt: #27272a;
  --color-surface: #111111;
  --color-text: #fafafa;
  --color-text-secondary: #a1a1aa;
  --color-text-muted: #52525b;
  --color-border: #27272a;
  --color-divider: #1c1c1e;
  --color-tab-bar: #0a0a0a;
  --color-tab-bar-border: #27272a;
  --color-tab-active: #3b82f6;
  --color-tab-inactive: #52525b;
}
```

Dark mode income/expense/transfer colors adjust for contrast:

```css
:root {
  --color-income: #16a34a;
  --color-expense: #dc2626;
  --color-transfer: #2563eb;
}

.dark {
  --color-income: #4ade80;
  --color-expense: #f87171;
  --color-transfer: #60a5fa;
}
```
