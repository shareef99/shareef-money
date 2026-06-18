import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { useQueryClient } from "@tanstack/react-query";
import { setActiveCurrency } from "@shareef-money/shared/utils";
import { useDatabase } from "./database-provider";
import { useAuth } from "./auth-provider";
import {
  importAll,
  isValidBackup,
  type BackupData,
} from "../services/backup-service";
import { writeAndShareBackup } from "../lib/backup-file";
import { SETTING_KEYS } from "../queries/use-settings";
import { RestoreConfirmModal } from "../components/restore-confirm-modal";

// Persisted so a pending restore survives an activity restart (low-RAM devices
// can have the app's activity recreated while the system file picker is front).
const MARKER_URI = `${FileSystem.documentDirectory}pending-restore.json`;

type RestoreContextValue = {
  // Open the confirm-replace flow for a validated backup.
  requestRestore: (backup: BackupData) => void;
};

const RestoreContext = createContext<RestoreContextValue | null>(null);

export function useRestore(): RestoreContextValue {
  const ctx = useContext(RestoreContext);
  if (!ctx) throw new Error("useRestore must be used within a RestoreProvider");
  return ctx;
}

export function RestoreProvider({ children }: { children: ReactNode }) {
  const { db } = useDatabase();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<BackupData | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  // Resume a restore that was confirmed-pending before a reload/restart.
  useEffect(() => {
    (async () => {
      try {
        const info = await FileSystem.getInfoAsync(MARKER_URI);
        if (!info.exists) return;
        const parsed = JSON.parse(await FileSystem.readAsStringAsync(MARKER_URI));
        if (isValidBackup(parsed)) setPending(parsed);
        else await FileSystem.deleteAsync(MARKER_URI, { idempotent: true });
      } catch {
        // Corrupt/unreadable marker — drop it.
        await FileSystem.deleteAsync(MARKER_URI, { idempotent: true }).catch(() => {});
      }
    })();
  }, []);

  const clearMarker = () =>
    FileSystem.deleteAsync(MARKER_URI, { idempotent: true }).catch(() => {});

  const requestRestore = (backup: BackupData) => {
    setPending(backup);
    // Persist immediately so the prompt reappears if the app restarts while it's up.
    FileSystem.writeAsStringAsync(MARKER_URI, JSON.stringify(backup)).catch(() => {});
  };

  const handleBackupFirst = async () => {
    if (!user) return;
    setBackingUp(true);
    try {
      await writeAndShareBackup(db, user.id);
    } catch (e) {
      console.warn("Backup failed", e);
      Alert.alert("Backup failed", "Couldn't create the backup file. Please try again.");
    } finally {
      setBackingUp(false);
    }
  };

  const handleReplace = () => {
    if (!user || !pending) return;
    try {
      importAll(db, user.id, pending);
      // Apply the restored currency immediately, then refresh every screen.
      const restoredCurrency = pending.data.settings.find(
        (s) => s.key === SETTING_KEYS.currencyCode,
      );
      if (restoredCurrency) setActiveCurrency(restoredCurrency.value as string);
      setPending(null);
      clearMarker();
      queryClient.invalidateQueries();
      Alert.alert("Restore complete", "Your data has been replaced from the backup.");
    } catch (e) {
      console.warn("Restore failed", e);
      setPending(null);
      clearMarker();
      Alert.alert(
        "Restore failed",
        "Something went wrong while restoring. Your existing data was left unchanged.",
      );
    }
  };

  const handleCancel = () => {
    setPending(null);
    clearMarker();
  };

  return (
    <RestoreContext value={{ requestRestore }}>
      {children}
      <RestoreConfirmModal
        visible={!!pending}
        exportedAt={pending?.exportedAt}
        backingUp={backingUp}
        onBackupFirst={handleBackupFirst}
        onReplace={handleReplace}
        onCancel={handleCancel}
      />
    </RestoreContext>
  );
}
