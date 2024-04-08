import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "@/app/providers";
import FirebaseRefreshToken from "@/app/firebase-refresh-token";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <FirebaseRefreshToken>{children}</FirebaseRefreshToken>
        </Providers>
      </body>
    </html>
  );
}
