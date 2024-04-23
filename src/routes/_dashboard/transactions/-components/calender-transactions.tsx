import { Card } from "@/components/ui/card";
import { Route } from "@/routes/_dashboard/transactions/index.lazy";

export default function CalenderTransactions() {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const search = Route.useSearch();
  const month = search.month;
  const year = search.year;

  // Functions
  const renderDays = () => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
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
    <Card className="w-full border-none bg-background p-0 m-0 text-foreground">
      <div className="grid grid-cols-7 gap-1 p-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center mb-4 text-sm text-accent-foreground"
          >
            {day}
          </div>
        ))}
        {renderDays()}
      </div>
    </Card>
  );
}
