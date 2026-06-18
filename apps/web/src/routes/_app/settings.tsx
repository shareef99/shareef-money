import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Select, SegmentedControl, Switch, useMantineColorScheme } from "@mantine/core";
import { CURRENCIES, setActiveCurrency } from "@shareef-money/shared/utils";
import { getSettings, useUpdateSettings } from "../../queries/settings";
import { Title } from "../../components/ui/title";
import { Text } from "../../components/ui/text";
import { SettingRow } from "../../components/settings/setting-row";
import { SettingsSection } from "../../components/settings/settings-section";

export const Route = createFileRoute("/_app/settings")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(getSettings());
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings } = useSuspenseQuery(getSettings());
  const update = useUpdateSettings();
  const { setColorScheme } = useMantineColorScheme();

  const bool = (key: string) => settings[key] === "true";
  const setBool = (key: string, value: boolean) => update.mutate({ [key]: String(value) });

  const theme = settings.theme ?? "system";
  const weekStart = settings.weekly_start_day === "monday" ? "monday" : "sunday";

  return (
    <div className="flex flex-col gap-6">
      <Title order={1}>Settings</Title>

      <SettingsSection title="Display">
        <SettingRow label="Currency" description="Used to format amounts everywhere.">
          <Select
            data={CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol}  ${c.name}` }))}
            value={settings.currency_code ?? "INR"}
            withAsterisk={false}
            allowDeselect={false}
            w={220}
            onChange={(value) => {
              if (!value) return;
              setActiveCurrency(value);
              update.mutate({ currency_code: value });
            }}
          />
        </SettingRow>

        <SettingRow label="Theme" description="Light, dark, or follow your system.">
          <SegmentedControl
            value={theme}
            onChange={(value) => {
              setColorScheme(value === "system" ? "auto" : (value as "light" | "dark"));
              update.mutate({ theme: value });
            }}
            data={[
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
              { label: "System", value: "system" },
            ]}
          />
        </SettingRow>

        <SettingRow label="Week starts on" description="Affects weekly stats and the calendar heatmap.">
          <SegmentedControl
            value={weekStart}
            onChange={(value) => update.mutate({ weekly_start_day: value })}
            data={[
              { label: "Sunday", value: "sunday" },
              { label: "Monday", value: "monday" },
            ]}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection title="Preferences">
        <SettingRow
          label="Carry forward income"
          description="Add each period's leftover income to the next."
        >
          <Switch checked={bool("carry_over")} onChange={(e) => setBool("carry_over", e.currentTarget.checked)} />
        </SettingRow>
        <SettingRow label="Subcategories" description="Enable nested categories when adding entries.">
          <Switch
            checked={bool("subcategory_enabled")}
            onChange={(e) => setBool("subcategory_enabled", e.currentTarget.checked)}
          />
        </SettingRow>
        <SettingRow label="People on transactions" description="Tag people on income and expenses.">
          <Switch
            checked={bool("contacts_enabled")}
            onChange={(e) => setBool("contacts_enabled", e.currentTarget.checked)}
          />
        </SettingRow>
        <SettingRow label="Locations on transactions" description="Tag a place on income and expenses.">
          <Switch
            checked={bool("locations_enabled")}
            onChange={(e) => setBool("locations_enabled", e.currentTarget.checked)}
          />
        </SettingRow>
        <Text variant="muted" size="xs" className="py-3">
          Preferences sync with the mobile app.
        </Text>
      </SettingsSection>
    </div>
  );
}
