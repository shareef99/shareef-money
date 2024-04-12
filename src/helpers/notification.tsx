import { ExternalToast, toast } from "sonner";
import { X } from "lucide-react";

export const showNotification = (message: string, data?: ExternalToast) => {
  return toast(message, {
    cancel: (
      <X
        className="size-4 cursor-pointer absolute top-4 right-4"
        onClick={() => toast.dismiss(data?.id)}
      />
    ),
    ...data,
  });
};

export const loadingNotification = (message: string, data?: ExternalToast) => {
  return toast.loading(message, { ...data });
};

export const successNotification = (message: string, data?: ExternalToast) => {
  return toast.success(message, {
    cancel: (
      <X
        className="size-4 cursor-pointer absolute top-4 right-4"
        onClick={() => toast.dismiss(data?.id)}
      />
    ),
    ...data,
  });
};

export const errorNotification = (message: string, data?: ExternalToast) => {
  return toast.error(message, {
    cancel: (
      <X
        className="size-4 cursor-pointer absolute top-4 right-4"
        onClick={() => toast.dismiss(data?.id)}
      />
    ),
    ...data,
  });
};

export const infoNotification = (message: string, data?: ExternalToast) => {
  return toast.info(message, {
    cancel: (
      <X
        className="size-4 cursor-pointer absolute top-4 right-4"
        onClick={() => toast.dismiss(data?.id)}
      />
    ),
    ...data,
  });
};

export const warningNotification = (message: string, data?: ExternalToast) => {
  return toast.warning(message, {
    cancel: (
      <X
        className="size-4 cursor-pointer absolute top-4 right-4"
        onClick={() => toast.dismiss(data?.id)}
      />
    ),
    ...data,
  });
};

export const dismissNotification = (id: string) => {
  toast.dismiss(id);
};
