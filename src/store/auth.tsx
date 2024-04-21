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

type AuthState = { auth: AuthUser | null; token: string | null };
type AuthAction = {
  login: (_auth: { auth: AuthUser; token: string }) => void;
  logout: () => void;
  updateToken: (_token: string) => void;
};

export type AuthStore = AuthState & AuthAction;

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      auth: null,
      token: null,
      login: (state) => set({ auth: state.auth, token: state.token }),
      logout: () => set({ auth: null }),
      updateToken: (token) => set({ token }),
    }),
    {
      name: localStorageKeys.authUser,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useAuth = () => useAuthStore((state) => state.auth);
export const useAuthToken = () => useAuthStore((state) => state.token);
export const useAuthLogin = () => useAuthStore((state) => state.login);
export const useAuthLogout = () => useAuthStore((state) => state.logout);
export const useAuthUpdateToken = () =>
  useAuthStore((state) => state.updateToken);
