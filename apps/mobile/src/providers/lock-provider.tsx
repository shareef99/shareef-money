import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { hasPasscode } from "../lib/passcode";

type LockContextValue = {
  // Lock is enabled (a passcode is set) AND the app is currently locked.
  isLocked: boolean;
  // A passcode is configured for this device.
  lockEnabled: boolean;
  unlock: () => void;
  // Re-read passcode state after enabling/disabling it in settings.
  refresh: () => Promise<void>;
};

const LockContext = createContext<LockContextValue | null>(null);

export function useLock(): LockContextValue {
  const context = useContext(LockContext);
  if (!context) {
    throw new Error("useLock must be used within a LockProvider");
  }
  return context;
}

export function LockProvider({ children }: { children: ReactNode }) {
  const [lockEnabled, setLockEnabled] = useState(false);
  // Start locked until we know whether a passcode exists, so the UI never
  // flashes the app content before the lock screen on a protected device.
  const [isLocked, setIsLocked] = useState(true);

  const refresh = useCallback(async () => {
    const enabled = await hasPasscode();
    setLockEnabled(enabled);
    setIsLocked(enabled);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-lock whenever the app leaves the foreground, so returning to it
  // requires the passcode again.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        setIsLocked((prev) => prev || lockEnabled);
      }
    });
    return () => sub.remove();
  }, [lockEnabled]);

  const unlock = useCallback(() => setIsLocked(false), []);

  return (
    <LockContext value={{ isLocked: lockEnabled && isLocked, lockEnabled, unlock, refresh }}>
      {children}
    </LockContext>
  );
}
