import { Transaction } from "@/types/transaction";
import { getDaysInMonth, getDay, getDate } from "date-fns";
import { useEffect, useState } from "react";

type Props = {
  month: number;
  year: number;
  transactions: Transaction[];
};

type WeekDay = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
type CalenderTransaction = {
  day: number;
  transactions: Transaction[];
  income: number;
  expense: number;
};

export default function CalenderTransactions({
  month,
  year,
  transactions,
}: Props) {
  const daysOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const weeklyStartDay: WeekDay = "mon";

  // State
  const [calenderTransactions, setCalenderTransactions] = useState<
    CalenderTransaction[]
  >([]);

  // Effect
  useEffect(() => {
    const calenderTransactions: CalenderTransaction[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const day = getDate(transaction.transaction_at);
      if (!calenderTransactions[day]) {
        calenderTransactions[day] = {
          day: day,
          transactions: [],
          income: 0,
          expense: 0,
        };
      }

      calenderTransactions[day].transactions.push(transaction);

      if (transaction.type === "income") {
        calenderTransactions[day].income += transaction.amount;
      } else if (transaction.type === "expense") {
        calenderTransactions[day].expense += transaction.amount;
      }
    }

    setCalenderTransactions(calenderTransactions.filter((t) => Boolean(t)));
  }, [transactions]);

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
      const transaction = calenderTransactions.find(
        (transaction) => transaction.day === day
      );

      days.push(
        <div key={day} className="border flex flex-col h-28 p-2 gap-1">
          <span>{day}</span>
          {transaction && transaction.income !== 0 && (
            <span className="text-primary">{transaction.income}</span>
          )}
          {transaction && transaction.expense != 0 && (
            <span className="text-destructive">{transaction.expense}</span>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="w-full border-none bg-background text-foreground">
      <div className="grid grid-cols-7 gap-1 p-2">
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
