import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Navbar } from "@/components/nav-bar";
import { Suspense } from "react";
import { WalletProvider } from "@/lib/wallet";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AutomationX",
  description: "Automate DeFi tasks on Bitcoin’s Rootstock Network",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark antialiased`}>
      <body className="font-sans bg-background text-foreground">
        <WalletProvider>
          <div className="relative min-h-dvh overflow-x-clip">
            <Suspense fallback={<div>Loading...</div>}>
              <Navbar />
              <main className="w-full">{children}</main>
              <Analytics />
            </Suspense>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
