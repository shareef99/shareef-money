import { notifications } from "@mantine/notifications";
import type { NotificationData } from "@mantine/notifications";

export function showNotification(args: NotificationData) {
  return notifications.show(args);
}

export function updateNotification(args: NotificationData & { id: string }) {
  return notifications.update(args);
}

export function loadingNotification(args: NotificationData) {
  return notifications.show({
    loading: true,
    autoClose: false,
    withCloseButton: false,
    ...args,
  });
}

export function successNotification({
  update = false,
  ...args
}: NotificationData & { id?: string; update?: boolean }) {
  if (update && args.id) {
    return notifications.update({
      color: "var(--primary)",
      loading: false,
      autoClose: 3000,
      withCloseButton: true,
      ...args,
    });
  } else {
    return notifications.show({
      color: "var(--primary)",
      loading: false,
      autoClose: 3000,
      withCloseButton: true,
      ...args,
    });
  }
}

export function errorNotification({
  update = false,
  ...args
}: NotificationData & { id?: string; update?: boolean }) {
  if (update && args.id) {
    return notifications.update({
      color: "var(--destructive)",
      id: args.id,
      loading: false,
      autoClose: 3000,
      withCloseButton: true,
      ...args,
    });
  } else {
    return notifications.show({
      color: "var(--destructive)",
      autoClose: 3000,
      withCloseButton: true,
      ...args,
    });
  }
}

export const notificationMessages = {
  loading: "Please Wait",
  success: "Success",
  added: "Successfully Added",
  edited: "Successfully Edited",
  deleted: "Successfully Deleted",
  error: "Unknown Error",
} as const;
