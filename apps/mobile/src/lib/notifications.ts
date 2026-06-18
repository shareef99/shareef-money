import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { formatCurrency } from "@shareef-money/shared/utils";

// Show the reminder as a banner even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = "reminders";

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Schedule a single daily repeating reminder at "HH:MM" (clears any prior one).
// Returns false if notification permission was denied.
export async function scheduleDailyReminder(time: string): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Shareef Money",
      body: "Don't forget to log today's transactions.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: Number.isFinite(hour) ? hour : 21,
      minute: Number.isFinite(minute) ? minute : 0,
      channelId: CHANNEL_ID,
    },
  });
  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Debt due-date reminders ─────────────────────────────────────────
// Each open debt with a future due date gets a one-off reminder at 9 AM on that
// day, keyed by contact id so it can be replaced/cancelled without touching the
// daily reminder above.
const DEBT_PREFIX = "debt-";

type DebtReminder = {
  contactId: number;
  name: string;
  net: number; // >0 they owe you, <0 you owe them
  dueDate: Date | null;
};

export async function syncDebtReminders(people: DebtReminder[]): Promise<void> {
  // Cancelling/listing never needs permission — clear stale debt reminders first.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (typeof n.identifier === "string" && n.identifier.startsWith(DEBT_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  const now = Date.now();
  const due = people
    .filter((p) => p.net !== 0 && p.dueDate != null)
    .map((p) => {
      const d = p.dueDate!;
      const fire = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0, 0);
      return { ...p, fire };
    })
    .filter((p) => p.fire.getTime() > now);

  if (due.length === 0) return; // nothing to schedule → don't prompt for permission

  const granted = await requestNotificationPermission();
  if (!granted) return;
  await ensureAndroidChannel();

  for (const p of due) {
    const owesYou = p.net > 0;
    const amount = formatCurrency(Math.abs(p.net));
    await Notifications.scheduleNotificationAsync({
      identifier: `${DEBT_PREFIX}${p.contactId}`,
      content: {
        title: owesYou ? "Money owed to you" : "Debt due",
        body: owesYou
          ? `${p.name} owes you ${amount} — due today.`
          : `You owe ${p.name} ${amount} — due today.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: p.fire,
        channelId: CHANNEL_ID,
      },
    });
  }
}
