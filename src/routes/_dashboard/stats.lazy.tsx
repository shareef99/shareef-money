import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_dashboard/stats")({
  component: () => <div>Hello /_dashboard/stats!</div>,
});
