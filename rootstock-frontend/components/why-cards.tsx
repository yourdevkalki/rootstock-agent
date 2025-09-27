import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, LineChart, Fuel } from "lucide-react"

const items = [
  {
    title: "Time-Based Automation",
    desc: "Schedule agents to run hourly, daily, or weekly—reliably and hands-free.",
    Icon: Clock,
  },
  {
    title: "Signal/Price Triggers",
    desc: "React to on-chain signals or token thresholds with deterministic execution.",
    Icon: LineChart,
  },
  {
    title: "Cost-Aware Execution",
    desc: "Minimize on-chain costs using lean strategies and batched flows.",
    Icon: Fuel,
  },
]

export function WhyCards() {
  return (
    <section aria-labelledby="why-title" className="mx-auto px-4 py-20">
      <div className="rounded-2xl border border-border/60 bg-card/50 p-8 backdrop-blur supports-[backdrop-filter]:bg-card/40">
        <header className="mb-8 space-y-3">
          <h2 id="why-title" className="text-pretty text-3xl font-semibold tracking-tight">
            Automate actions with confidence
          </h2>
          <p className="max-w-2xl text-pretty text-base text-muted-foreground leading-relaxed">
            Rootstock Agent helps you define precise strategies and execute them on your schedule or when the market
            moves—without constant monitoring.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="sm">
              <Link href="/create-task">Create a Task</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-border/60 bg-transparent">
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {items.map((it) => (
            <Card
              key={it.title}
              className="border-border/60 bg-card/70 transition will-change-transform hover:-translate-y-0.5 hover:ring-1 hover:ring-primary/40"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <it.Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <CardTitle className="text-lg tracking-wide">{it.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-foreground/80">{it.desc}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
