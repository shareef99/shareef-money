import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { useDatabase } from "./database-provider";
import { useAuth } from "./auth-provider";
import { api } from "../lib/api";
import * as syncService from "../services/sync-service";

type SyncContextValue = {
  sync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncAt: number;
  triggerSync: () => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}

const SYNC_DEBOUNCE_MS = 10_000;
const FOREGROUND_SYNC_INTERVAL_MS = 5 * 60 * 1000;

export function SyncProvider({ children }: { children: ReactNode }) {
  const { db } = useDatabase();
  const { user, isAuthenticated } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sync = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await syncService.fullSync(db, api, user.id);
      const ts = await syncService.getLastSyncAt();
      setLastSyncAt(ts);
    } catch (e) {
      console.warn("Sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [db, isAuthenticated, user, isSyncing]);

  const triggerSync = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      sync();
    }, SYNC_DEBOUNCE_MS);
  }, [sync]);

  useEffect(() => {
    if (isAuthenticated && user) {
      sync();
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && isAuthenticated) {
        const now = Date.now();
        if (now - lastSyncAt > FOREGROUND_SYNC_INTERVAL_MS) {
          sync();
        }
      }
    });
    return () => sub.remove();
  }, [isAuthenticated, lastSyncAt, sync]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return (
    <SyncContext value={{ sync, isSyncing, lastSyncAt, triggerSync }}>
      {children}
    </SyncContext>
  );
}
