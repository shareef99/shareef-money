import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Sidebar from "../components/sidebar";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context }) => {
    console.log(context);

    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();
  const [opened] = useDisclosure();

  return (
    <AppShell
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
    >
      <AppShell.Navbar>
        <Sidebar user={user!} />
      </AppShell.Navbar>
      <AppShell.Main>
        <div className="p-6">
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
