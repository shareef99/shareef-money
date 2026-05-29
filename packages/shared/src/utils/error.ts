/**
 * Parses an error of any shape and returns a readable error message.
 *
 * Handles:
 * - Plain strings
 * - `Error` instances
 * - API response bodies with `message`, `error`, `errors`, or `msg` fields
 * - Zod issue arrays (`{ path, message }`)
 * - Class-validator `ValidationError` objects (`{ constraints }`)
 * - String arrays (`["field is required", "email is invalid"]`)
 * - Any object with a `message` property
 *
 * @param error - The error to parse. Can be any type.
 * @param defaultError - Fallback message if nothing can be extracted.
 * @returns A human-readable error string.
 */
export function parseError(
  error: unknown,
  defaultError = "unknown-error",
): string {
  if (!error) return defaultError;

  if (typeof error === "string") return error;

  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;

    if ("response" in obj && typeof obj.response === "object" && obj.response !== null) {
      const response = obj.response as Record<string, unknown>;
      if (typeof response.data === "object" && response.data !== null) {
        const extracted = extractFromResponseData(response.data as Record<string, unknown>);
        if (extracted) return extracted;
      }
      if (typeof response.data === "string") return response.data;
    }

    const extracted = extractFromResponseData(obj);
    if (extracted) return extracted;

    if ("message" in obj && typeof obj.message === "string") {
      return obj.message;
    }
  }

  if (error instanceof Error) return error.message;

  return defaultError;
}

/**
 * Parses an API error response (e.g., from `fetch`) and returns a readable message.
 *
 * Attempts to read the response body as JSON and extract error details.
 * Falls back to the HTTP status text if the body can't be parsed.
 *
 * @param response - A fetch `Response` object.
 * @param defaultError - Fallback message.
 * @returns A human-readable error string.
 */
export async function parseResponseError(
  response: Response,
  defaultError = "unknown-error",
): Promise<string> {
  try {
    const data: unknown = await response.json();

    if (typeof data === "string") return data;

    if (typeof data === "object" && data !== null) {
      const extracted = extractFromResponseData(
        data as Record<string, unknown>,
      );
      if (extracted) return extracted;
    }
  } catch {
    // body isn't JSON
  }

  if (response.statusText) return response.statusText;

  return defaultError;
}

function extractFromResponseData(
  data: Record<string, unknown>,
): string | null {
  const targetFields = ["errors", "message", "error", "msg"];

  for (const field of targetFields) {
    const val = data[field];

    if (!val) continue;

    if (typeof val === "string") return val;

    if (Array.isArray(val)) {
      const parsed = parseArray(val);
      if (parsed) return parsed;
    }
  }

  return null;
}

function parseArray(arr: unknown[]): string | null {
  const messages = arr
    .map((item) => {
      if (typeof item === "string") return item;

      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;

        if (
          "constraints" in obj &&
          typeof obj.constraints === "object" &&
          obj.constraints
        ) {
          return Object.values(obj.constraints).join(", ");
        }

        if (typeof obj.message === "string") {
          if (Array.isArray(obj.path) && obj.path.length > 0) {
            return `${(obj.path as string[]).join(".")}: ${obj.message}`;
          }
          return obj.message;
        }
      }

      return null;
    })
    .filter(Boolean);

  return messages.length > 0 ? messages.join(", ") : null;
}
