import { PermissionsAndroid, Platform } from "react-native";

// READ_SMS is Android-only; iOS exposes no SMS-inbox API to any app, so the
// import feature simply doesn't exist there ("unavailable").
export type SmsPermissionResult =
  | "granted"
  | "denied"
  // User chose "Don't ask again" (or policy blocked it) — the system dialog
  // will no longer appear; only the app-settings screen can change it.
  | "blocked"
  | "unavailable";

export function isSmsPlatform(): boolean {
  return Platform.OS === "android";
}

export async function checkSmsPermission(): Promise<boolean> {
  if (!isSmsPlatform()) return false;
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
}

export async function requestSmsPermission(): Promise<SmsPermissionResult> {
  if (!isSmsPlatform()) return "unavailable";
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_SMS,
  );
  if (result === PermissionsAndroid.RESULTS.GRANTED) return "granted";
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return "blocked";
  return "denied";
}
