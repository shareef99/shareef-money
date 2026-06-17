import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";

// Device-level app lock. The PIN is never stored in plain text: we keep a
// random salt plus the SHA-256 hash of (salt + pin) in the device keystore.
// Presence of the hash is what marks the lock as enabled.
//
// Threat model: a 4-digit PIN has only 10k combinations, so the real defense
// against guessing is the attempt lockout below (escalating cool-downs that
// survive app restarts because they live in the keystore). The salt+hash sit
// in the OS keystore (hardware-backed on most devices); we don't add a PBKDF2
// stretch because expo-crypto exposes only one-shot digests and an async
// stretch loop would noticeably delay every unlock.
const HASH_KEY = "passcode_hash";
const SALT_KEY = "passcode_salt";
// Biometric preference is device-local (not synced), so it lives in the
// keystore alongside the passcode rather than in the synced settings table.
const BIOMETRIC_KEY = "biometric_enabled";
// Brute-force lockout state (also keystore-resident so it can't be reset by
// killing the app).
const ATTEMPTS_KEY = "passcode_attempts";
const LOCKOUT_UNTIL_KEY = "passcode_lockout_until";
const FREE_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30_000; // first cool-down, doubles each further miss
const MAX_LOCKOUT_MS = 15 * 60_000;

async function hash(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );
}

export async function hasPasscode(): Promise<boolean> {
  return (await SecureStore.getItemAsync(HASH_KEY)) !== null;
}

export async function setPasscode(pin: string): Promise<void> {
  const salt = Crypto.randomUUID();
  await SecureStore.setItemAsync(SALT_KEY, salt);
  await SecureStore.setItemAsync(HASH_KEY, await hash(pin, salt));
  await resetLockout();
}

export async function verifyPasscode(pin: string): Promise<boolean> {
  const [storedHash, salt] = await Promise.all([
    SecureStore.getItemAsync(HASH_KEY),
    SecureStore.getItemAsync(SALT_KEY),
  ]);
  if (!storedHash || !salt) return false;
  return (await hash(pin, salt)) === storedHash;
}

export async function clearPasscode(): Promise<void> {
  await SecureStore.deleteItemAsync(HASH_KEY);
  await SecureStore.deleteItemAsync(SALT_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
  await resetLockout();
}

export type LockoutState = {
  // Number of consecutive failed attempts.
  attempts: number;
  // Epoch ms until which entry is blocked (0 = not locked out).
  lockedUntilMs: number;
};

async function readInt(key: string): Promise<number> {
  const v = await SecureStore.getItemAsync(key);
  const n = v ? Number(v) : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function getLockoutState(): Promise<LockoutState> {
  const [attempts, lockedUntilMs] = await Promise.all([
    readInt(ATTEMPTS_KEY),
    readInt(LOCKOUT_UNTIL_KEY),
  ]);
  return { attempts, lockedUntilMs };
}

// Record a wrong PIN. After FREE_ATTEMPTS misses, impose an escalating
// cool-down (30s, 1m, 2m … capped at 15m). Returns the new state.
export async function recordFailedAttempt(): Promise<LockoutState> {
  const attempts = (await readInt(ATTEMPTS_KEY)) + 1;
  await SecureStore.setItemAsync(ATTEMPTS_KEY, String(attempts));

  let lockedUntilMs = 0;
  if (attempts >= FREE_ATTEMPTS) {
    const over = attempts - FREE_ATTEMPTS; // 0 on the first locked attempt
    const wait = Math.min(BASE_LOCKOUT_MS * 2 ** over, MAX_LOCKOUT_MS);
    lockedUntilMs = Date.now() + wait;
    await SecureStore.setItemAsync(LOCKOUT_UNTIL_KEY, String(lockedUntilMs));
  }
  return { attempts, lockedUntilMs };
}

export async function resetLockout(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ATTEMPTS_KEY),
    SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY),
  ]);
}

// Whether the device has biometric hardware with at least one enrolled
// fingerprint/face — i.e. biometric unlock can be offered.
export async function canUseBiometrics(): Promise<boolean> {
  const [hasHardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && enrolled;
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === "true";
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_KEY, enabled ? "true" : "false");
}

// Prompt the OS biometric dialog. Returns true on a successful match.
export async function authenticateBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock Shareef Money",
    cancelLabel: "Use passcode",
    disableDeviceFallback: true,
  });
  return result.success;
}
