"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

export function HeroParallax() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    const onScroll = () => {
      const y = window.scrollY;
      el.style.transform = `translate3d(0, ${y * -0.15}px, 0)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative mx-auto flex flex-col items-center gap-6 px-4 pb-24 pt-20 md:pt-28">
      {/* TaskX Tag */}
      <div className="mb-4">
        <span className="inline-block bg-gradient-to-r from-green-400 to-green-500 text-black px-3 py-1 rounded-md text-sm font-bold">
          AutomationX
        </span>
      </div>

      <h1 className="text-balance text-center text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-8xl">
        <span className="inline-block bg-gradient-to-r from-green-400 to-green-500 text-black px-2 py-1 rounded-md mx-1">
          Automate
        </span>
        <span className="inline-block bg-gradient-to-r from-pink-500 to-pink-600 text-white px-2 py-1 rounded-md mx-1">
         Anything in DeFi.
        </span>
        <br  className="mt-2"/>
        <span className="text-white mx-1"> Powered by AI </span>
        <span className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-md mx-1">
        on Bitcoin’s
        </span>
        <br />
        <span className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 rounded-md mx-1">
        Rootstock
        </span>
        <span className="text-white mx-1">Network</span>
      </h1>
      <p className="text-pretty max-w-4xl text-center text-base leading-relaxed text-foreground/80 md:text-xl">
       From swaps to lending, compounding, or custom strategies. <br/> Just tell TaskX what you want, and let AI bots execute.
      </p>
      <div className="flex items-center gap-3 mt-12">
        <Link href="/create-task">
          <Button
            size="lg"
            className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-black transition-all duration-300 px-8 py-6 text-xl font-semibold"
          >
            Automate Now
          </Button>
        </Link>
      </div>

    </section>
  );
}
