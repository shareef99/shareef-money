import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { UserProfile } from "@shareef-money/shared/validation";
import MantineProvider from "../providers/mantine";
import { getMe } from "../queries/auth";

type RouteContext = {
  queryClient: QueryClient;
  user: UserProfile | null;
};

export const Route = createRootRouteWithContext<RouteContext>()({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(getMe());
    return { user };
  },
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
