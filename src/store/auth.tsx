import { WeekStartDay } from "@/types/enums";
import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";
import { localStorageKeys } from "@/constants/local-storage";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  currency: string;
  refer_code: string;
  week_start_day: WeekStartDay;
  month_start_date: number;
  createdAt: string;
  updatedAt: string;
};

type AuthState = { auth: AuthUser | null };
type AuthAction = {
  login: (_auth: AuthUser) => void;
  logout: () => void;
};

export type AuthStore = AuthState & AuthAction;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      auth: null,
      login: (auth) => set({ auth: auth }),
      logout: () => set({ auth: null }),
    }),
    {
      name: localStorageKeys.authUser,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
