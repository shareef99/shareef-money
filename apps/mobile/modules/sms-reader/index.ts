import { requireNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

export type RawSms = {
  id: string;
  address: string;
  body: string;
  /** Received timestamp, epoch ms. */
  date: number;
};

type SmsReaderNative = {
  getMessages(sinceMs: number, limit: number): Promise<RawSms[]>;
};

// iOS has no SMS-inbox API at all (Apple doesn't expose one to any app), so
// the module only exists on Android and every caller gets an empty result on
// other platforms — the feature simply isn't offered there.
const native: SmsReaderNative | null =
  Platform.OS === "android" ? requireNativeModule("SmsReader") : null;

export const isSmsReaderAvailable = native != null;

/** Inbox messages newer than `sinceMs`, newest first. */
export async function getSmsMessages(options: {
  sinceMs: number;
  limit?: number;
}): Promise<RawSms[]> {
  if (!native) return [];
  return native.getMessages(options.sinceMs, options.limit ?? 3000);
}
