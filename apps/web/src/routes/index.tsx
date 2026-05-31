import { Button } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">Shareef Money</h1>
      <Button className="ml-4" onClick={() => alert("Hello, world!")}>
        Click me
      </Button>
    </div>
  );
}
