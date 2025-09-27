"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./wallet-connect";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  // const links = [
  //   // { href: "/dashboard", label: "Dashboard" },
  // ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
      <div className="mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {/* <Image
            src="/rootstock-logo.jpg"
            alt="TaskX"
            width={24}
            height={24}
            className="rounded-sm"
          /> */}
          <span className="text-2xl font-bold text-[#ff9101] ">
            Automation𝕏

          </span>
        </Link>

        {/* <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm text-foreground/80 transition-colors hover:text-foreground",
                pathname === l.href && "text-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav> */}

        <div className="flex items-center gap-2">
          <Link href="/create-task">
            <Button className="btn-gradient hover:opacity-95">
              Create Your Task
            </Button>
          </Link>
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
