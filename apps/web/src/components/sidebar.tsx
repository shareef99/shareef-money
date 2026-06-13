import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@mantine/core";
import {
  ArrowLeftRight,
  BarChart3,
  Wallet,
  Settings,
  LogOut,
} from "lucide-react";
import type { UserProfile } from "@shareef-money/shared/validation";
import { useLogout } from "../queries/auth";

type Props = {
  user: UserProfile;
};

const navItems = [
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export default function Sidebar({ user }: Props) {
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <nav className="flex flex-col h-full py-4 px-3">
      <div className="mb-8 px-2">
        <h2 className="text-lg font-bold text-foreground">Shareef Money</h2>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-foreground-secondary hover:bg-card transition-colors"
            activeProps={{
              className:
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium bg-primary/10 text-primary",
            }}
          >
            <Icon size={20} strokeWidth={1.5} />
            {label}
          </Link>
        ))}
      </div>

      <div className="border-t border-border pt-4 px-2">
        <p className="text-sm font-medium text-foreground truncate">
          {user.name}
        </p>
        <p className="text-xs text-foreground-muted truncate mb-3">
          {user.email}
        </p>
        <Button
          variant="ghost"
          size="xs"
          leftSection={<LogOut size={14} />}
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => {
                navigate({ to: "/login" });
              },
            })
          }
          loading={logout.isPending}
          className="w-full"
        >
          Sign out
        </Button>
      </div>
    </nav>
  );
}
