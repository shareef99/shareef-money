import { Pressable, ScrollView, Switch, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useSettings, useSetSetting, SETTING_KEYS } from "../../../queries/use-settings";
import { getColors } from "../../../lib/colors";
import { cn } from "../../../lib/cn";

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="bg-card px-4 py-2 mt-3">
      <Text className="text-xs font-semibold text-text-secondary uppercase">{title}</Text>
    </View>
  );
}

export default function ConfigurationScreen() {
  const router = useRouter();
  const { data: settings } = useSettings();
  const setSetting = useSetSetting();
  const c = getColors(useColorScheme());

  const toggle = (key: string, value: boolean) =>
    setSetting.mutate({ key, value: String(value) });

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
            <ArrowLeft size={24} className="text-text" />
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
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
