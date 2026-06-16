import "../../global.css";
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryProvider } from "../providers/query-provider";
import { AuthProvider } from "../providers/auth-provider";
import { LockProvider, useLock } from "../providers/lock-provider";
import { ThemedRoot } from "../components/themed-root";
import { LockScreen } from "../components/lock-screen";

function LockGate() {
  const { isLocked, unlock } = useLock();
  if (isLocked) {
    return <LockScreen onUnlock={unlock} />;
  }
  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <LockProvider>
            <ThemedRoot>
              <LockGate />
            </ThemedRoot>
          </LockProvider>
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
