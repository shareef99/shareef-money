import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ActionIcon, Drawer } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Menu } from "lucide-react";
import Sidebar from "../components/sidebar";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <div className="min-h-svh bg-background">
      {/* Desktop sidebar — fixed, lg+ uses Tailwind breakpoints (md = 48rem). */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-60 md:flex-col border-r border-border bg-card">
        <Sidebar user={user!} />
      </aside>

      {/* Mobile top bar with hamburger. */}
      <header className="md:hidden flex h-14 items-center gap-3 border-b border-border bg-card px-4">
        <ActionIcon variant="muted" onClick={open} aria-label="Open menu">
          <Menu size={20} />
        </ActionIcon>
        <span className="text-base font-bold text-text">Shareef Money</span>
      </header>

      {/* Mobile drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        size={240}
        padding={0}
        withCloseButton={false}
        classNames={{ content: "bg-card", body: "h-full" }}
      >
        <Sidebar user={user!} onNavigate={close} />
      </Drawer>

      <main className="md:pl-60">
        <div className="mx-auto max-w-6xl p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
