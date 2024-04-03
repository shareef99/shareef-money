import { WeekStartDay } from "@/types/enums";
import { DefaultValues } from "@/types/shared";

export type User = DefaultValues & {
  name: string;
  email: string;
  mobile: string | null;
  currency: string;
  month_start_date: number;
  week_start_day: WeekStartDay;
  refer_code: string;
};
