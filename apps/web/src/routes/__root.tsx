import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MantineProvider from "../providers/mantine";

type RouteContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouteContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Outlet />
      </MantineProvider>
    </QueryClientProvider>
  );
}
