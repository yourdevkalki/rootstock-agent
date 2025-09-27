import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Navbar } from "@/components/nav-bar"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Rootstock-Agent",
  description: "Automate DeFi tasks on Bitcoin’s Rootstock Network",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark antialiased`}>
      <body className="font-sans bg-background text-foreground">
        <div className="relative min-h-dvh overflow-x-clip">
          <Suspense fallback={<div>Loading...</div>}>
            <Navbar />
            <main className="w-full">{children}</main>
            <Analytics />
          </Suspense>
        </div>
      </body>
    </html>
  )
}
