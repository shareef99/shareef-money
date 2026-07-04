import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

// A stable, device-local user id. In the local-first build every row is owned by
// this single id (there are no accounts). It's persisted in the device keystore
// and doubles as the "guest" identity to claim if cloud accounts are added
// later — so re-enabling sync needs no schema/userId change, just a claim step.
const LOCAL_USER_ID_KEY = "local_user_id";

export async function getLocalUserId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(LOCAL_USER_ID_KEY);
  if (existing) return existing;
  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(LOCAL_USER_ID_KEY, id);
  return id;
}
