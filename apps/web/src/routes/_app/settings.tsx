import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Settings</h1>
      <p className="text-foreground-secondary mt-2">Coming soon.</p>
    </div>
  );
}
