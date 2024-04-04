"use client";

import { BarChart3, BookMinus, Home, Wallet } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const sidebarItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      count: 0,
    },
    {
      name: "Transactions",
      href: "/transactions",
      icon: BookMinus,
      count: 0,
    },
    {
      name: "Accounts",
      href: "/accounts",
      icon: Wallet,
      count: 0,
    },
    {
      name: "Stats",
      href: "/stats",
      icon: BarChart3,
      count: 0,
    },
  ] as const;

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {sidebarItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
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
              6
            </Badge>
          )}
        </Link>
      ))}
    </nav>
  );
}
