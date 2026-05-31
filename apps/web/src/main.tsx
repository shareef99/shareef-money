import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import "./index.css";
import Loader from "./components/ui/loader";
import ErrorMessage from "./components/ui/error-message";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: false,
    },
  },
});

const router = createRouter({
  routeTree,
  defaultPreload: "viewport",
  context: { queryClient },
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: () => <Loader fullscreen />,
  defaultErrorComponent: ({ error }) => <ErrorMessage error={error} />,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
