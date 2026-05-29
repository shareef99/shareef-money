import "../../global.css";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryProvider } from "../providers/query-provider";
import { AuthProvider } from "../providers/auth-provider";

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Slot />
      </AuthProvider>
    </QueryProvider>
  );
}
