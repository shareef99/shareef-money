import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, MessageSquareText, RefreshCw, ShieldCheck } from "lucide-react-native";
import { useSmsImports, useScanSms, useSetSmsStatus } from "../../../queries/use-sms-imports";
import {
  checkSmsPermission,
  requestSmsPermission,
  isSmsPlatform,
} from "../../../lib/sms-permission";
import type { SmsImportStatus } from "../../../services/sms-import-service";
import { SmsImportCard } from "../../../components/sms/sms-import-card";
import { getColors } from "../../../lib/colors";
import { cn } from "../../../lib/cn";

// "unknown" until the first check resolves; "ask" = not granted, dialog can
// still be shown; "blocked" = user chose "Don't ask again" → only the system
// app-settings screen can enable it.
type PermissionState = "unknown" | "granted" | "ask" | "blocked";

const TABS: { key: SmsImportStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "imported", label: "Imported" },
  { key: "dismissed", label: "Dismissed" },
];

export default function SmsInboxScreen() {
  const router = useRouter();
  const c = getColors(useColorScheme().colorScheme);
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [tab, setTab] = useState<SmsImportStatus>("pending");

  const { data: items = [] } = useSmsImports(tab);
  const scan = useScanSms();
  const setStatus = useSetSmsStatus();

  const refresh = useCallback(() => {
    if (!scan.isPending) scan.mutate({});
  }, [scan]);

  // Check permission on mount and whenever the app comes back to the
  // foreground (e.g. returning from the system settings screen).
  useEffect(() => {
    let live = true;
    const check = () =>
      checkSmsPermission().then((ok) => {
        if (!live) return;
        setPermission((prev) => {
          if (ok) return "granted";
          return prev === "blocked" ? "blocked" : "ask";
        });
      });
    check();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") check();
    });
    return () => {
      live = false;
      sub.remove();
    };
  }, []);

  // First scan as soon as permission lands.
  const scanned = scan.isSuccess || scan.isPending;
  useEffect(() => {
    if (permission === "granted" && !scanned) refresh();
  }, [permission, scanned, refresh]);

  const handleEnable = async () => {
    const result = await requestSmsPermission();
    if (result === "granted") setPermission("granted");
    else if (result === "blocked") setPermission("blocked");
    else setPermission("ask");
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={c.text} />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2 flex-1">
            SMS Inbox
          </Text>
          {permission === "granted" && (
            <Pressable onPress={refresh} className="p-2" disabled={scan.isPending}>
              <RefreshCw
                size={20}
                color={scan.isPending ? c.textMuted : c.textSecondary}
              />
            </Pressable>
          )}
        </View>

        {!isSmsPlatform() ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-text-secondary text-center">
              SMS import is only available on Android — iPhones don&apos;t let
              any app read SMS messages.
            </Text>
          </View>
        ) : permission === "unknown" ? (
          // Blank beat while the first permission check resolves — avoids
          // flashing the disclosure at users who already granted access.
          <View className="flex-1" />
        ) : permission === "granted" ? (
          <>
            <View className="flex-row gap-2 px-4 pb-2">
              {TABS.map((t) => (
                <Pressable
                  key={t.key}
                  className={cn(
                    "flex-1 py-1.5 items-center rounded-full border",
                    tab === t.key ? "bg-primary border-primary" : "bg-card border-border",
                  )}
                  onPress={() => setTab(t.key)}
                >
                  <Text
                    className={cn(
                      "text-sm",
                      tab === t.key ? "text-primary-foreground" : "text-text-secondary",
                    )}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {scan.isSuccess && tab === "pending" && (
              <Text className="px-4 pb-2 text-xs text-text-muted">
                Scan found {scan.data.found} new transaction SMS
                {scan.data.autoImported > 0
                  ? ` · ${scan.data.autoImported} auto-imported`
                  : ""}
              </Text>
            )}

            <FlatList
              data={items}
              keyExtractor={(sms) => String(sms.id)}
              contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
              // Hundreds of messages arrive on the first scan — virtualize.
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={7}
              refreshControl={
                <RefreshControl
                  refreshing={scan.isPending}
                  onRefresh={refresh}
                  tintColor={c.textSecondary}
                />
              }
              ListEmptyComponent={
                <View className="items-center py-20 px-8">
                  <MessageSquareText size={32} color={c.textMuted} />
                  <Text className="text-text-secondary text-base mt-3">
                    {scan.isPending
                      ? "Scanning your inbox…"
                      : tab === "pending"
                        ? "No transaction SMS waiting"
                        : `Nothing ${tab} yet`}
                  </Text>
                  {tab === "pending" && !scan.isPending && (
                    <Text className="text-text-muted text-sm mt-1 text-center">
                      Pull down to rescan. New bank messages appear here
                      automatically.
                    </Text>
                  )}
                </View>
              }
              renderItem={({ item: sms }) => (
                <SmsImportCard
                  sms={sms}
                  onImport={() =>
                    router.push({
                      pathname: "/add-transaction",
                      params: { smsId: String(sms.id) },
                    })
                  }
                  onDismiss={() =>
                    setStatus.mutate({ id: sms.id, status: "dismissed" })
                  }
                  onRestore={() =>
                    setStatus.mutate({ id: sms.id, status: "pending" })
                  }
                  onOpenTransaction={() => {
                    if (sms.transactionId) {
                      router.push({
                        pathname: "/add-transaction",
                        params: { id: String(sms.transactionId) },
                      });
                    }
                  }}
                />
              )}
            />
          </>
        ) : (
          // Disclosure + the denied / blocked states.
          <View className="flex-1 px-6 pt-8">
            <View className="items-center mb-6">
              <ShieldCheck size={40} color={c.primary} />
            </View>
            <Text className="text-xl font-semibold text-text text-center mb-3">
              Import transactions from SMS
            </Text>
            <Text className="text-sm text-text-secondary text-center leading-5 mb-2">
              Shareef Money can read the transaction alerts your bank already
              sends you and turn them into transactions — no more typing.
            </Text>
            <Text className="text-sm text-text-secondary text-center leading-5 mb-6">
              Messages are read and parsed{" "}
              <Text className="font-semibold text-text">
                on this device only
              </Text>
              . Nothing is uploaded, and OTPs or personal chats are never
              stored.
            </Text>

            {permission === "blocked" ? (
              <>
                <Text className="text-xs text-expense text-center mb-3">
                  SMS permission is turned off for this app. Enable it from the
                  system settings to use SMS import.
                </Text>
                <Pressable
                  className="h-12 rounded-xl bg-primary items-center justify-center active:opacity-80"
                  onPress={() => Linking.openSettings()}
                >
                  <Text className="text-base font-semibold text-primary-foreground">
                    Open app settings
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                className="h-12 rounded-xl bg-primary items-center justify-center active:opacity-80"
                onPress={handleEnable}
              >
                <Text className="text-base font-semibold text-primary-foreground">
                  Allow SMS access
                </Text>
              </Pressable>
            )}

            <Pressable
              className="h-12 mt-3 rounded-xl items-center justify-center active:opacity-70"
              onPress={() => router.back()}
            >
              <Text className="text-base font-medium text-text-secondary">
                Not now
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
