export function parseError(error: unknown): string | null {
  if (!error) return null;

  if (typeof error === "string") return error;

  // if (error instanceof KyInstance ) {
  //   if (error.response) {
  //     if (error.response.data) {
  //       if (error.response.data.message) {
  //         return error.response.data.message;
  //       }

  //       if (error.response.data.error) {
  //         return error.response.data.error;
  //       }

  //       if (error.response.data.msg) {
  //         return error.response.data.msg;
  //       }
  //     }
  //   }
  // }

  if (error instanceof Error) return error.message;

  return null;
}

/**
 *
 * @param str string
 * @returns string
 *
 * Take a string and make every first letter of a word capital.
 * example:
 * 1. hello World => Hello World
 * 2. hello world => Hello World
 * 3. hello_world => Hello World
 * 4. hello-world => Hello World
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

export const ONE_MB = 1024 * 1024;

export function formatNumber(
  n: number | string | null | undefined = 0,
  locale: Intl.LocalesArgument | undefined = "en-US",
  options: Intl.NumberFormatOptions | undefined = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }
): string {
  if (n === null || n === undefined) return "0";

  if (typeof n === "string") {
    n = parseFloat(n);
  }

  return n.toLocaleString(locale, options);
}
