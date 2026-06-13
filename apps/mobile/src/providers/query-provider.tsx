import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Queries read local SQLite (the source of truth) and reads are instant,
      // so always re-read on mount rather than serving stale cached data.
      // Mutations invalidate the relevant keys; sync writes are picked up on the
      // next mount. A non-zero staleTime made seeded initialData skip the DB read.
      staleTime: 0,
      retry: false,
    },
  },
});

export { queryClient };

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
