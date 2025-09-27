"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"

export function HeroParallax() {
  const bgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bgRef.current
    if (!el) return
    const onScroll = () => {
      const y = window.scrollY
      el.style.transform = `translate3d(0, ${y * -0.15}px, 0)`
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <section className="relative mx-auto flex flex-col items-center gap-6 px-4 pb-24 pt-20 md:pt-28">
      {/* Parallax gradient backdrop */}
      <div ref={bgRef} aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-1/2 top-0 h-[60vh] w-[120vw] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(60% 60% at 50% 40%, var(--primary), transparent 70%)" }}
        />
        <div
          className="absolute right-[-20vw] top-[20vh] h-[50vh] w-[70vw] rounded-full blur-3xl"
          style={{ background: "radial-gradient(60% 60% at 50% 50%, var(--accent-2), transparent 70%)" }}
        />
        <div
          className="absolute left-[-15vw] bottom-0 h-[45vh] w-[60vw] rounded-full blur-3xl"
          style={{ background: "radial-gradient(60% 60% at 50% 50%, var(--accent), transparent 70%)" }}
        />
        <div className="scanline absolute inset-0 opacity-30" />
      </div>

      <h1 className="text-balance text-center text-4xl font-light tracking-widest sm:text-5xl md:text-6xl">
        <span className="text-gradient">Automate Your DeFi Tasks</span> on Bitcoin’s Rootstock Network.
      </h1>
      <p className="text-pretty max-w-2xl text-center text-base leading-relaxed text-foreground/80 md:text-lg">
        Create tasks once. Let bots handle swaps, compounding, and investments automatically.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/create-task">
          <Button size="lg" className="btn-gradient neon-glow">
            Create Your Task
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button size="lg" variant="secondary" className="bg-secondary text-secondary-foreground">
            View Dashboard
          </Button>
        </Link>
      </div>

      {/* 3-step process */}
      <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { title: "Create", desc: "Define time or price conditions" },
          { title: "Execute", desc: "Bots trigger actions automatically" },
          { title: "Track", desc: "See status and logs in real-time" },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border border-border/60 bg-card/60 p-5 transition hover:neon-glow">
            <div className="text-sm uppercase tracking-wide text-foreground/70">{c.title}</div>
            <div className="mt-1 text-sm text-foreground/80">{c.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
