import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

// Device-level app lock. The PIN is never stored in plain text: we keep a
// random salt plus the SHA-256 hash of (salt + pin) in the device keystore.
// Presence of the hash is what marks the lock as enabled.
const HASH_KEY = "passcode_hash";
const SALT_KEY = "passcode_salt";

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
}
