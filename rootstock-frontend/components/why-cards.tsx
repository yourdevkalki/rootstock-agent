import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LineChart, Fuel } from "lucide-react";

const items = [
  {
    title: "Easy Set-Up",
    desc: "Create automated DeFi tasks with natural language in minutes",
    Icon: Clock,
    color: "green",
  },
  {
    title: "Smart Execution",
    desc: "AI-powered automation that reacts to market conditions intelligently",
    Icon: LineChart,
    color: "pink",
  },
  {
    title: "Better Performance",
    desc: "Get faster execution and better gas optimization",
    Icon: Fuel,
    color: "orange",
  },
];

export function WhyCards() {
  return (
    <section aria-labelledby="why-title" className="mx-auto px-4 py-20">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-black text-sm font-bold">
            01
          </div>
          <h2 id="why-title" className="text-2xl font-bold text-white">
            How it works
          </h2>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {items.map((it, index) => {
            const colorClasses = {
              green: "bg-gradient-to-r from-green-400 to-green-500",
              pink: "bg-gradient-to-r from-pink-500 to-pink-600",
              orange: "bg-gradient-to-r from-orange-500 to-orange-600",
            };

            return (
              <div
                key={it.title}
                className="border-2 border-white bg-transparent p-6 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`${
                      colorClasses[it.color as keyof typeof colorClasses]
                    } text-white px-3 py-1 rounded-md font-bold text-sm`}
                  >
                    {it.title}
                  </div>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      colorClasses[it.color as keyof typeof colorClasses]
                    } text-white text-xs font-bold`}
                  >
                    {index + 1}.
                  </div>
                </div>
                <p className="text-sm text-white/80">{it.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
