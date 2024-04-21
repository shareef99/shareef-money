import FirebaseRefreshToken from "@/providers/firebase-refresh-token";
import { ThemeProvider } from "@/providers/theme-provider";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <FirebaseRefreshToken>
          <Outlet />
          <Toaster />
          <TanStackRouterDevtools />
        </FirebaseRefreshToken>
      </QueryClientProvider>
    </ThemeProvider>
  ),
});
