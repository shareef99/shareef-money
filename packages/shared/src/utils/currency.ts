const SMALLEST_UNIT_DIVISOR = 100;

export type Currency = {
  /** ISO 4217 code, e.g. "INR". Used as the stored setting value. */
  code: string;
  /** Display symbol, e.g. "₹". */
  symbol: string;
  /** Human-readable name shown in the picker. */
  name: string;
  /** Locale used for grouping/decimal formatting. */
  locale: string;
};

/** Currencies the user can choose from. First entry is the default. */
export const CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "en-IE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "en-AE" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", locale: "en-SA" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", locale: "de-CH" },
];

const DEFAULT_CURRENCY = CURRENCIES[0]!;

/**
 * The currency used by formatCurrency/formatAmount when no symbol/locale is
 * passed. Set once from user settings via setActiveCurrency so the ~30 call
 * sites that do `formatCurrency(amount)` pick up the user's choice.
 */
let activeCurrency: Currency = DEFAULT_CURRENCY;

export function getCurrencyByCode(code: string | undefined): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? DEFAULT_CURRENCY;
}

export function setActiveCurrency(code: string | undefined): void {
  activeCurrency = getCurrencyByCode(code);
}

export function getActiveCurrency(): Currency {
  return activeCurrency;
}

/**
 * Converts a display amount (e.g., 27104.00) to the smallest currency unit (e.g., 2710400 paise).
 * Use this when saving user input to the database.
 *
 * @param amount - The display amount (rupees, dollars, etc.)
 * @returns The amount in the smallest unit (paise, cents, etc.)
 */
export function toSmallestUnit(amount: number): number {
  return Math.round(amount * SMALLEST_UNIT_DIVISOR);
}

/**
 * Converts from the smallest currency unit (e.g., 2710400 paise) to a display amount (e.g., 27104.00).
 * Use this when reading from the database for display.
 *
 * @param amount - The amount in the smallest unit (paise, cents, etc.)
 * @returns The display amount (rupees, dollars, etc.)
 */
export function fromSmallestUnit(amount: number): number {
  return amount / SMALLEST_UNIT_DIVISOR;
}

/**
 * Formats an amount stored in the smallest currency unit (paise/cents) into a display string.
 *
 * @param amount - The amount in smallest unit (e.g., 2710400 for ₹27,104.00)
 * @param symbol - The currency symbol (e.g., "₹", "$")
 * @param locale - The locale for number formatting (defaults to "en-IN")
 * @returns Formatted string like "₹ 27,104.00"
 */
export function formatCurrency(
  amount: number,
  symbol: string = activeCurrency.symbol,
  locale: Intl.LocalesArgument = activeCurrency.locale,
): string {
  const display = fromSmallestUnit(amount);
  const formatted = display.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${formatted}`;
}

/**
 * Formats an amount in smallest unit without the currency symbol.
 * Useful for numeric displays in charts or tables.
 *
 * @param amount - The amount in smallest unit
 * @param locale - The locale for number formatting
 * @returns Formatted number string like "27,104.00"
 */
export function formatAmount(
  amount: number,
  locale: Intl.LocalesArgument = activeCurrency.locale,
): string {
  const display = fromSmallestUnit(amount);
  return display.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
