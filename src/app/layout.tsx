import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "@/providers/query-providers";
import FirebaseRefreshToken from "@/providers/firebase-refresh-token";
import { ThemeProvider } from "@/providers/theme-providers";
import { localStorageKeys } from "@/constants/local-storage";
import { Toaster } from "@/components/ui/sonner";

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
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={["light", "dark", "dark-aqua", "light-violet"]}
            storageKey={localStorageKeys.theme}
          >
            <FirebaseRefreshToken>
              {children}
              <Toaster />
            </FirebaseRefreshToken>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
