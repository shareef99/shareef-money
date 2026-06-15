import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";

// Device-level app lock. The PIN is never stored in plain text: we keep a
// random salt plus the SHA-256 hash of (salt + pin) in the device keystore.
// Presence of the hash is what marks the lock as enabled.
const HASH_KEY = "passcode_hash";
const SALT_KEY = "passcode_salt";
// Biometric preference is device-local (not synced), so it lives in the
// keystore alongside the passcode rather than in the synced settings table.
const BIOMETRIC_KEY = "biometric_enabled";

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
