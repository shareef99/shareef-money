import dayjs from "dayjs";

/**
 * Global Date Format for consistency across application.
 * @property {string} default - The default date format (e.g., "DD MMM, YYYY").
 * @property {string} dateWithTimeFormat - Date format with time in 24-hour format (e.g., "DD MMM, YYYY HH:mm:ss").
 * @property {string} dateWith24HourTimeFormat - Alias for dateWithTimeFormat.
 * @property {string} dateWith12HourTimeFormat - Date format with time in 12-hour format (e.g., "DD MMM, YYYY hh:mm A").
 * @property {string} backendDateFormat - Date format used for backend communication (e.g., "YYYY-MM-DD").
 * @property {string} backendDateTimeFormat - Date and time format used for backend communication (e.g., "YYYY-MM-DD HH:mm:ss").
 */
export const dateFormat = {
  default: "DD MMM, YYYY",
  dateWithTimeFormat: "DD MMM, YYYY HH:mm:ss",
  dateWith24HourTimeFormat: "DD MMM, YYYY HH:mm:ss",
  dateWith12HourTimeFormat: "DD MMM, YYYY hh:mm A",
  backendDateFormat: "YYYY-MM-DD",
  backendDateTimeFormat: "YYYY-MM-DD HH:mm:ss",
} as const;

/**
 * Formats a given date to a specified format.
 *
 * @param {Date|string|null|undefined} date - The date to format. Can be a `Date` object or a string. If null or undefined, it will return "-".
 * @param {keyof typeof dateFormat} [format="default"] - The desired format for the date. Defaults to the `default` format.
 * @returns {string} The formatted date string.
 *
 * @example
 * // Format a Date object to the default format
 * formatDate(new Date()); // e.g., "05 Jan, 2025"
 *
 * @example
 * // Format a string date to a specific format
 * formatDate("2025-01-05", "backendDateFormat"); // "2025-01-05"
 *
 * @example
 * // Format with time in 24-hour format
 * formatDate(new Date(), "dateWithTimeFormat"); // e.g., "05 Jan, 2025 14:30:45"
 */
export const formatDate = (
  date: Date | string | null | undefined,
  format: keyof typeof dateFormat = "default",
): string => {
  if (!date) return "-";
  return dayjs(date).format(dateFormat[format]);
};
