/**
 * Capitalizes each word in a string, replacing underscores (`_`) and hyphens (`-`) with spaces.
 *
 * @param {string} str - The string to capitalize.
 * @returns {string} The capitalized string with words separated by spaces.
 *
 * @example
 * // Capitalizing a simple string
 * const result = capitalize("hello world");
 * console.log(result); // Output: "Hello World"
 *
 * @example
 * // Capitalizing a string with underscores
 * const result = capitalize("hello_world");
 * console.log(result); // Output: "Hello World"
 *
 * @example
 * // Capitalizing a string with hyphens
 * const result = capitalize("hello-world");
 * console.log(result); // Output: "Hello World"
 *
 * @example
 * // Capitalizing a mixed string with underscores and hyphens
 * const result = capitalize("hello_world-and_universe");
 * console.log(result); // Output: "Hello World And Universe"
 *
 * @example
 * // Handling an empty string
 * const result = capitalize("");
 * console.log(result); // Output: ""
 *
 * @example
 * // Handling a string that doesn't need capitalization
 * const result = capitalize("Already Capitalized");
 * console.log(result); // Output: "Already Capitalized"
 */
export function capitalize(str: string): string {
  if (typeof str !== "string" || str.length === 0) {
    return str;
  }

  return str
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

/**
 * Formats a number or a string representing a number into a localized string with specified options.
 *
 * @param {number | string | null | undefined} [n=0] - The number to format. Can also be a string representing a number, `null`, or `undefined`.
 * @param {Intl.LocalesArgument} [locale="en-US"] - The locale to use for formatting. Defaults to "en-US".
 * @param {Intl.NumberFormatOptions} [options={ minimumFractionDigits: 2, maximumFractionDigits: 2 }] - The options for number formatting, such as the number of decimal places.
 * @returns {string} A formatted number as a string.
 *
 * @example
 * // Formatting a number with default locale and options
 * const formatted = formatNumber(12345.678);
 * console.log(formatted); // Output: "12,345.68" (in "en-US" locale)
 *
 * @example
 * // Formatting a string representation of a number
 * const formatted = formatNumber("9876.543");
 * console.log(formatted); // Output: "9,876.54" (in "en-US" locale)
 *
 * @example
 * // Handling null or undefined input
 * const formatted = formatNumber(null);
 * console.log(formatted); // Output: "0"
 *
 * @example
 * // Formatting with a different locale
 * const formatted = formatNumber(12345.678, "de-DE");
 * console.log(formatted); // Output: "12.345,68" (in "de-DE" locale)
 *
 * @example
 * // Customizing formatting options
 * const formatted = formatNumber(12345.678, "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
 * console.log(formatted); // Output: "12,345.678"
 */
export function formatNumber(
  n: number | string | null | undefined = 0,
  locale: Intl.LocalesArgument | undefined = "en-US",
  options: Intl.NumberFormatOptions | undefined = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
): string {
  if (n === null || n === undefined) return "0";

  if (typeof n === "string") {
    n = parseFloat(n);
  }
  
  if (Number.isNaN(n)) return "0";

  return n.toLocaleString(locale, options);
}
