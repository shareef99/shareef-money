import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ReactNode } from "react";
import Sidebar from "@/app/(dashboard)/sidebar";
import { getServerSession } from "next-auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex items-center border-b px-4 py-4 lg:px-6">
            <div className="font-semibold">
              <span className="">
                {session ? session.user.name : "No Name"}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <Sidebar />
          </div>
          <div className="mt-auto p-4">
            <Card>
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Upgrade to Pro</CardTitle>
                <CardDescription>
                  Unlock all features and get unlimited access to our support
                  team.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full">
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex justify-between px-4 lg:px-6 py-4 items-center">
          <div className="font-semibold">
            <span>{session ? session.user.name : "No Name"}</span>
          </div>
          <header>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <Sidebar />
              </SheetContent>
            </Sheet>
          </header>
        </div>
        <section className="px-4 lg:px-6">{children}</section>
      </div>
    </div>
  );
}
