import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/stats")({
  component: StatsPage,
});

function StatsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Stats</h1>
      <p className="text-foreground-secondary mt-2">Coming soon.</p>
    </div>
  );
}
