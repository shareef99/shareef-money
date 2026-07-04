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
import { useQueryClient } from "@tanstack/react-query";
import { useDatabase } from "./database-provider";
import { useAuth } from "./auth-provider";
import { api } from "../lib/api";
import * as syncService from "../services/sync-service";
import * as recurringService from "../services/recurring-service";

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

// Cloud sync is OFF in the local-first build. The entire sync pipeline (this
// provider + sync-service + the API client) is kept intact but dormant so it can
// be switched back on when a backend/BaaS is added — flip this to true then.
const SYNC_ENABLED = false;

const SYNC_DEBOUNCE_MS = 10_000;
const FOREGROUND_SYNC_INTERVAL_MS = 5 * 60 * 1000;

export function SyncProvider({ children }: { children: ReactNode }) {
  const { db } = useDatabase();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Synchronous in-flight guard: state updates are async, so two syncs fired in
  // the same tick could both pass an `isSyncing` state check and double-push.
  const syncingRef = useRef(false);

  const sync = useCallback(async () => {
    if (!SYNC_ENABLED) return;
    if (!isAuthenticated || !user) return;
    if (syncingRef.current) return;

    syncingRef.current = true;
    setIsSyncing(true);
    try {
      // Generate any recurring transactions that are now due BEFORE pushing, so
      // they're included in this same sync cycle. (Doing it separately races the
      // sync cursor, which could advance past them and never push them.)
      const created = await recurringService.materializeDueRecurring(db, user.id);
      if (created > 0) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["recurring"] });
      }
      await syncService.fullSync(db, api, user.id);
      const ts = await syncService.getLastSyncAt();
      setLastSyncAt(ts);
    } catch (e) {
      console.warn("Sync failed:", e);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [db, isAuthenticated, user, queryClient]);

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
