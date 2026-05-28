const SMALLEST_UNIT_DIVISOR = 100;

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
  symbol = "₹",
  locale: Intl.LocalesArgument = "en-IN",
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
  locale: Intl.LocalesArgument = "en-IN",
): string {
  const display = fromSmallestUnit(amount);
  return display.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
