import { getDaysInMonth, getDay } from "date-fns";

type Props = {
  month: number;
  year: number;
};

type WeekDay = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export default function CalenderTransactions({ month, year }: Props) {
  const daysOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const weeklyStartDay: WeekDay = "mon";

  // Functions
  const renderDays = () => {
    const firstDayOfMonth = getDay(`${year}-${month}-01`);
    const totalDaysInMonth = getDaysInMonth(`${year}-${month}-01`);

    const days = [];

    for (
      let i = 0;
      i < (firstDayOfMonth - daysOfWeek.indexOf(weeklyStartDay)) % 7;
      i++
    ) {
      days.push(<div key={`empty-${i}`} className=""></div>);
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      days.push(
        <div key={day} className="border h-32 p-2">
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="w-full border-none bg-background text-foreground">
      <div className="grid grid-cols-7 gap-1 p-2">
        {/* {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center mb-4 text-sm text-accent-foreground"
          >
            {day}
          </div>
        ))} */}
        {/* Render Weekdays with respect to weeklyStartDay */}
        {daysOfWeek
          .slice(daysOfWeek.indexOf(weeklyStartDay))
          .concat(daysOfWeek.slice(0, daysOfWeek.indexOf(weeklyStartDay)))
          .map((day) => (
            <div
              key={day}
              className="text-center mb-4 text-sm text-accent-foreground capitalize"
            >
              {day}
            </div>
          ))}
        {renderDays()}
      </div>
    </div>
  );
}
