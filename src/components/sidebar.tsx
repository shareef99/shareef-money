import { BarChart3, BookMinus, UserRoundCog, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { SwitchTheme } from "@/components/switch-theme";
import { transactionsSchema } from "@/routes/_dashboard/transactions/index.lazy";

export default function Sidebar() {
  const router = useRouterState();
  const pathname = router.location.pathname;
  const search = router.location.search;

  const sidebarItems = [
    {
      name: "Transactions",
      href: "/transactions",
      icon: BookMinus,
      search: transactionsSchema.parse(search),
      count: 0,
    },
    {
      name: "Stats",
      href: "/stats",
      icon: BarChart3,
      search: {},
      count: 0,
    },
    {
      name: "Accounts",
      href: "/accounts",
      icon: Wallet,
      search: {},
      count: 0,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: UserRoundCog,
      search: {},
      count: 0,
    },
    {
      name: "Home",
      href: "/",
      icon: UserRoundCog,
      search: {},
      count: 0,
    },
  ] as const;

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {sidebarItems.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          search={item.search}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            pathname === item.href &&
              "text-primary bg-muted hover:text-primary/80"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.name}
          {item.count !== 0 && (
            <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
              {item.count}
            </Badge>
          )}
        </Link>
      ))}
      <div className="mt-4">
        <SwitchTheme />
      </div>
    </nav>
  );
}
