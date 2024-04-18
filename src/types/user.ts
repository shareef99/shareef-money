import { WeekStartDay } from "@/types/enums";

export type User = {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  currency: string;
  month_start_date: number;
  week_start_day: WeekStartDay;
  refer_code: string;
  createdAt: string;
  updatedAt: string;
};
