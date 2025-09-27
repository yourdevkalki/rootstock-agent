"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HowItWorks() {
  return (
    <section className="mx-auto px-4 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - How it works */}
          <div>
            <header className="mb-8 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-black text-sm font-bold">
                01
              </div>
              <h2 className="text-2xl font-bold text-white">How it works</h2>
            </header>
          </div>
        </div>
      </div>
    </section>
   
  );
}
