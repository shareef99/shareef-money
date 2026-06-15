import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { ArrowLeft, Download } from "lucide-react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useSettings, useSetSetting, SETTING_KEYS } from "../../../queries/use-settings";
import { useTransactions } from "../../../queries/use-transactions";
import { useLock } from "../../../providers/lock-provider";
import {
  clearPasscode,
  canUseBiometrics,
  isBiometricEnabled,
  setBiometricEnabled,
} from "../../../lib/passcode";
import { scheduleDailyReminder, cancelDailyReminder } from "../../../lib/notifications";
import { PasscodeSetupModal } from "../../../components/passcode-setup-modal";
import { transactionsToCsv } from "../../../lib/csv";
import { getColors } from "../../../lib/colors";
import { cn } from "../../../lib/cn";

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="bg-card px-4 py-2 mt-3">
      <Text className="text-xs font-semibold text-text-secondary uppercase">{title}</Text>
    </View>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: { key: T; label: string }[];
  value: T;
  onSelect: (key: T) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {options.map((opt) => (
        <Pressable
          key={opt.key}
          className={cn(
            "flex-1 py-2 items-center rounded-lg border",
            value === opt.key ? "bg-primary border-primary" : "bg-card border-border",
          )}
          onPress={() => onSelect(opt.key)}
        >
          <Text
            className={cn(
              "text-sm",
              value === opt.key ? "text-primary-foreground" : "text-text-secondary",
            )}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function ConfigurationScreen() {
  const router = useRouter();
  const { data: settings } = useSettings();
  const setSetting = useSetSetting();
  const { data: transactions = [] } = useTransactions({});
  const { lockEnabled, refresh: refreshLock } = useLock();
  const [showPasscodeSetup, setShowPasscodeSetup] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [biometricOn, setBiometricOn] = useState(false);
  const [canBiometric, setCanBiometric] = useState(false);
  const c = getColors(useColorScheme());

  useEffect(() => {
    isBiometricEnabled().then(setBiometricOn);
    canUseBiometrics().then(setCanBiometric);
  }, []);

  const toggle = (key: string, value: boolean) =>
    setSetting.mutate({ key, value: String(value) });

  const handleLockToggle = (value: boolean) => {
    if (value) {
      setShowPasscodeSetup(true);
    } else {
      clearPasscode().then(() => {
        setBiometricOn(false);
        refreshLock();
      });
    }
  };

  const handleReminderToggle = async (value: boolean) => {
    toggle(SETTING_KEYS.reminderEnabled, value);
    if (value) {
      const ok = await scheduleDailyReminder(settings.reminderTime);
      if (!ok) {
        Alert.alert(
          "Notifications off",
          "Enable notifications for Shareef Money in your system settings to get reminders.",
        );
        toggle(SETTING_KEYS.reminderEnabled, false);
      }
    } else {
      await cancelDailyReminder();
    }
  };

  const handleReminderTime = (date: Date) => {
    setShowTimePicker(false);
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const time = `${hh}:${mm}`;
    setSetting.mutate({ key: SETTING_KEYS.reminderTime, value: time });
    if (settings.reminderEnabled) scheduleDailyReminder(time);
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value && !canBiometric) {
      Alert.alert(
        "No biometrics enrolled",
        "Add a fingerprint or face unlock in your device settings first.",
      );
      return;
    }
    await setBiometricEnabled(value);
    setBiometricOn(value);
  };

  const reminderDate = (() => {
    const [h, m] = settings.reminderTime.split(":").map(Number);
    const d = new Date();
    d.setHours(h ?? 21, m ?? 0, 0, 0);
    return d;
  })();

  const handleExport = async () => {
    if (transactions.length === 0) {
      Alert.alert("Nothing to export", "You have no transactions yet.");
      return;
    }
    try {
      const csv = transactionsToCsv(transactions);
      const uri = `${FileSystem.cacheDirectory}shareef-money-transactions.csv`;
      await FileSystem.writeAsStringAsync(uri, csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "text/csv",
          dialogTitle: "Export transactions",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Sharing unavailable", `Saved to ${uri}`);
      }
    } catch (e) {
      Alert.alert("Export failed", String(e));
    }
  };

  const SwitchRow = ({
    label,
    description,
    value,
    settingKey,
  }: {
    label: string;
    description?: string;
    value: boolean;
    settingKey: string;
  }) => (
    <View className="flex-row items-center px-4 py-3.5 border-b border-border">
      <View className="flex-1 pr-3">
        <Text className="text-base text-text">{label}</Text>
        {description ? (
          <Text className="text-xs text-text-muted mt-0.5">{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => toggle(settingKey, v)}
        trackColor={{ false: c.border, true: c.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={c.text} />
          </Pressable>
          <Text className="text-lg font-semibold text-text ml-2">Configuration</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <SectionHeader title="Input" />
          <View className="px-4 py-3.5 border-b border-border">
            <Text className="text-base text-text mb-2">Swipe on transactions</Text>
            <View className="flex-row gap-2">
              {(
                [
                  { key: "change_date", label: "Change month" },
                  { key: "change_tab", label: "Change tab" },
                ] as const
              ).map((opt) => (
                <Pressable
                  key={opt.key}
                  className={cn(
                    "flex-1 py-2 items-center rounded-lg border",
                    settings.swipeAction === opt.key
                      ? "bg-primary border-primary"
                      : "bg-card border-border",
                  )}
                  onPress={() =>
                    setSetting.mutate({ key: SETTING_KEYS.swipeAction, value: opt.key })
                  }
                >
                  <Text
                    className={cn(
                      "text-sm",
                      settings.swipeAction === opt.key
                        ? "text-primary-foreground"
                        : "text-text-secondary",
                    )}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <SectionHeader title="Display" />
          <View className="px-4 py-3.5 border-b border-border">
            <Text className="text-base text-text mb-2">Start screen</Text>
            <Segmented
              value={settings.startScreen}
              onSelect={(key) =>
                setSetting.mutate({ key: SETTING_KEYS.startScreen, value: key })
              }
              options={[
                { key: "transactions", label: "Trans." },
                { key: "stats", label: "Stats" },
                { key: "accounts", label: "Accts" },
                { key: "more", label: "More" },
              ]}
            />
          </View>
          <View className="px-4 py-3.5 border-b border-border">
            <Text className="text-base text-text mb-2">Week starts on</Text>
            <Segmented
              value={settings.weekStartDay}
              onSelect={(key) =>
                setSetting.mutate({ key: SETTING_KEYS.weekStartDay, value: key })
              }
              options={[
                { key: "sunday", label: "Sunday" },
                { key: "monday", label: "Monday" },
              ]}
            />
          </View>
          <View className="flex-row items-center px-4 py-3.5 border-b border-border">
            <View className="flex-1 pr-3">
              <Text className="text-base text-text">Month starts on day</Text>
              <Text className="text-xs text-text-muted mt-0.5">
                For monthly summaries & budgets (e.g. payday).
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Pressable
                className="w-9 h-9 rounded-lg bg-card items-center justify-center active:opacity-70"
                onPress={() =>
                  setSetting.mutate({
                    key: SETTING_KEYS.monthStartDay,
                    value: String(Math.max(1, settings.monthStartDay - 1)),
                  })
                }
              >
                <Text className="text-xl text-text">−</Text>
              </Pressable>
              <Text className="text-base text-text w-7 text-center">
                {settings.monthStartDay}
              </Text>
              <Pressable
                className="w-9 h-9 rounded-lg bg-card items-center justify-center active:opacity-70"
                onPress={() =>
                  setSetting.mutate({
                    key: SETTING_KEYS.monthStartDay,
                    value: String(Math.min(28, settings.monthStartDay + 1)),
                  })
                }
              >
                <Text className="text-xl text-text">+</Text>
              </Pressable>
            </View>
          </View>

          <SectionHeader title="Required fields" />
          <Text className="px-4 pt-2 pb-1 text-xs text-text-muted">
            Category is always required.
          </Text>
          <SwitchRow
            label="Require subcategory"
            value={settings.requireSubcategory}
            settingKey={SETTING_KEYS.requireSubcategory}
          />
          <SwitchRow
            label="Require location"
            value={settings.requireLocation}
            settingKey={SETTING_KEYS.requireLocation}
          />
          <SwitchRow
            label="Require people"
            value={settings.requireContact}
            settingKey={SETTING_KEYS.requireContact}
          />

          <SectionHeader title="Carry-over" />
          <SwitchRow
            label="Carry forward income"
            description="Add each month's leftover income to the next month's total."
            value={settings.incomeCarryForward}
            settingKey={SETTING_KEYS.incomeCarryForward}
          />

          <SectionHeader title="Security" />
          <View className="flex-row items-center px-4 py-3.5 border-b border-border">
            <View className="flex-1 pr-3">
              <Text className="text-base text-text">App lock</Text>
              <Text className="text-xs text-text-muted mt-0.5">
                Require a 4-digit passcode to open the app.
              </Text>
            </View>
            <Switch
              value={lockEnabled}
              onValueChange={handleLockToggle}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          {lockEnabled && (
            <>
              <Pressable
                className="px-4 py-3.5 border-b border-border active:bg-card"
                onPress={() => setShowPasscodeSetup(true)}
              >
                <Text className="text-base text-text">Change passcode</Text>
              </Pressable>
              <View className="flex-row items-center px-4 py-3.5 border-b border-border">
                <View className="flex-1 pr-3">
                  <Text className="text-base text-text">Unlock with biometrics</Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    {canBiometric
                      ? "Use your fingerprint or face to unlock."
                      : "No fingerprint/face enrolled on this device."}
                  </Text>
                </View>
                <Switch
                  value={biometricOn}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: c.border, true: c.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </>
          )}

          <SectionHeader title="Notifications" />
          <View className="flex-row items-center px-4 py-3.5 border-b border-border">
            <View className="flex-1 pr-3">
              <Text className="text-base text-text">Daily reminder</Text>
              <Text className="text-xs text-text-muted mt-0.5">
                A daily nudge to log your transactions.
              </Text>
            </View>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          {settings.reminderEnabled && (
            <Pressable
              className="flex-row items-center justify-between px-4 py-3.5 border-b border-border active:bg-card"
              onPress={() => setShowTimePicker(true)}
            >
              <Text className="text-base text-text">Reminder time</Text>
              <Text className="text-base text-primary">{settings.reminderTime}</Text>
            </Pressable>
          )}

          <SectionHeader title="Data" />
          <Pressable
            className="flex-row items-center px-4 py-3.5 border-b border-border active:bg-card"
            onPress={handleExport}
          >
            <Download size={20} color={c.text} />
            <View className="flex-1 ml-3">
              <Text className="text-base text-text">Export transactions (CSV)</Text>
              <Text className="text-xs text-text-muted mt-0.5">
                Share or save all transactions as a spreadsheet.
              </Text>
            </View>
          </Pressable>
        </ScrollView>

        <PasscodeSetupModal
          visible={showPasscodeSetup}
          onClose={() => setShowPasscodeSetup(false)}
          onDone={() => {
            setShowPasscodeSetup(false);
            refreshLock();
          }}
        />

        {showTimePicker && (
          <DateTimePicker
            value={reminderDate}
            mode="time"
            onChange={(event, date) => {
              if (event.type === "dismissed" || !date) {
                setShowTimePicker(false);
                return;
              }
              handleReminderTime(date);
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
