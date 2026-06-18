type Props = {
  message?: string;
};

export function ChartEmpty({ message = "No data for this period." }: Props) {
  return (
    <div className="flex h-40 items-center justify-center text-center text-sm text-text-muted">
      {message}
    </div>
  );
}
