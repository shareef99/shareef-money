import { Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type { Db } from "../db/client";
import { exportAll } from "../services/backup-service";

/** Serializes all data to a JSON file and opens the system share sheet. */
export async function writeAndShareBackup(db: Db, userId: string) {
  const backup = exportAll(db, userId);
  const json = JSON.stringify(backup);
  const stamp = new Date(backup.exportedAt).toISOString().slice(0, 10);
  const uri = `${FileSystem.cacheDirectory}shareef-money-backup-${stamp}.json`;
  await FileSystem.writeAsStringAsync(uri, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/json",
      dialogTitle: "Save Shareef Money backup",
      UTI: "public.json",
    });
  } else {
    Alert.alert("Backup saved", `Saved to ${uri}`);
  }
}
