import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/session-providers";
import { getServerSession } from "next-auth";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
