"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowUp, MessageCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createTask, type TaskType } from "@/lib/tasks"

type Direction = "above" | "below"

type ParsedPlan =
  | {
      type: "time"
      intervalHours: number
      swap: { tokenIn: string; tokenOut: string; amountIn: string }
      summary: string
    }
  | {
      type: "price"
      token: string
      direction: Direction
      threshold: number
      swap: { tokenIn: string; tokenOut: string; amountIn: string }
      summary: string
    }

const SUGGESTIONS = [
  "Every day at 9am swap 50 USDC to ETH",
  "When BTC rises above $70000, swap 1000 USDC to BTC",
  "DCA 10 USDC to RBTC every 6 hours",
]

const TOKEN_LIST = ["USDC", "ETH", "BTC", "RBTC"]

function normalizeToken(symbol: string) {
  const match = TOKEN_LIST.find((t) => t.toLowerCase() === symbol.toLowerCase())
  return match ?? symbol.toUpperCase()
}

// Very light “NLP” parser stub to preserve functionality until LangChain is integrated
function planFromText(inputRaw: string): ParsedPlan | null {
  const input = inputRaw.trim()

  // amount + pair: "swap 100 USDC to ETH" or "buy ETH with 100 USDC"
  const swapPairRe = /(swap|buy)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(?:to|for|into|with)\s*([a-zA-Z]+)/i
  const pair = input.match(swapPairRe)
  const amountIn = pair ? pair[2] : "1"
  const tokenIn = pair ? normalizeToken(pair[3]) : "USDC"
  const tokenOut = pair ? normalizeToken(pair[4]) : "ETH"

  // TIME-BASED: "every 6 hours" | "every day" | "daily" | "hourly" | "every week"
  const everyRe = /every\s+(\d+)?\s*(hour|hours|day|days|week|weeks)/i
  const dailyRe = /\b(daily|every\s*day)\b/i
  const hourlyRe = /\b(hourly)\b/i
  const weeklyRe = /\b(weekly|every\s*week)\b/i
  const timeMatch = input.match(everyRe)
  let intervalHours: number | null = null
  if (timeMatch) {
    const num = timeMatch[1] ? Number.parseInt(timeMatch[1], 10) : 1
    const unit = timeMatch[2].toLowerCase()
    if (unit.startsWith("hour")) intervalHours = Math.max(1, num)
    if (unit.startsWith("day")) intervalHours = Math.max(1, num * 24)
    if (unit.startsWith("week")) intervalHours = Math.max(1, num * 24 * 7)
  } else if (dailyRe.test(input)) {
    intervalHours = 24
  } else if (hourlyRe.test(input)) {
    intervalHours = 1
  } else if (weeklyRe.test(input)) {
    intervalHours = 24 * 7
  }

  // PRICE-BASED: "when BTC rises above $70000" | "if ETH drops below 2500" | "BTC > 70000"
  const priceRe1 = /(?:when|if)?\s*([a-zA-Z]+)\s*(rises\s*above|above|drops\s*below|below|>|<)\s*\$?\s*(\d+(?:\.\d+)?)/i
  const priceMatch = input.match(priceRe1)
  if (priceMatch) {
    const token = normalizeToken(priceMatch[1])
    const op = priceMatch[2].toLowerCase()
    const threshold = Number.parseFloat(priceMatch[3])
    const direction: Direction = op.includes("below") || op === "<" ? "below" : "above"

    return {
      type: "price",
      token,
      direction,
      threshold,
      swap: { tokenIn, tokenOut, amountIn },
      summary: `Swap ${amountIn} ${tokenIn} to ${tokenOut} when ${token} ${direction} $${threshold}`,
    }
  }

  if (intervalHours !== null) {
    return {
      type: "time",
      intervalHours,
      swap: { tokenIn, tokenOut, amountIn },
      summary: `Swap ${amountIn} ${tokenIn} to ${tokenOut} every ${intervalHours} hour(s)`,
    }
  }

  return null
}

export function ChatCreateTask() {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content:
        "Tell me what you want to automate. I can schedule swaps by time or trigger them when a price crosses a threshold.",
    },
  ])
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasUserMessage = messages.some((m) => m.role === "user")

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const text = input.trim()
    if (!text) return

    setMessages((m) => [...m, { role: "user", content: text }])
    setInput("")

    // Placeholder for future LangChain tool-calling integration
    const plan = planFromText(text)

    if (!plan) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I couldn’t understand that yet. Try something like: “Every 6 hours swap 10 USDC to ETH” or “When BTC rises above $70000, swap 1000 USDC to BTC”.",
        },
      ])
      return
    }

    try {
      setSubmitting(true)

      const base: { type: TaskType } = { type: plan.type }
      if (plan.type === "time") {
        await createTask({
          ...base,
          condition: { intervalHours: plan.intervalHours },
          swap: plan.swap,
        })
      } else {
        await createTask({
          ...base,
          condition: {
            token: plan.token,
            threshold: plan.threshold,
            direction: plan.direction,
          },
          swap: plan.swap,
        })
      }

      toast.success("Task created", { description: plan.summary })
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Done! ${plan.summary}. Redirecting to your dashboard...`,
        },
      ])
      router.push("/dashboard")
    } catch (err: any) {
      toast.error("Failed to create task", {
        description: err?.message ?? "Unknown error",
      })
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Something went wrong while creating your task. Please try again.",
        },
      ])
    } finally {
      setSubmitting(false)
    }
  }

  function applySuggestion(s: string) {
    setInput(s)
    // optional: submit immediately; we keep it manual so users can adjust
    inputRef.current?.focus()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs text-foreground/80">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Natural-language automation
        </span>
      </div>

      <form onSubmit={handleSubmit} className="relative" aria-label="Create task with chat">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 ring-1 ring-primary/20 focus-within:ring-primary/40">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about trading..."
            className="w-full bg-transparent px-1 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none"
            aria-label="Chat input"
          />
          <Button type="submit" className="rounded-full" disabled={!input.trim() || submitting} aria-label="Send">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-foreground/60">
        Examples: “Every 6 hours swap 10 USDC to ETH” · “When BTC rises above $70,000, swap 1,000 USDC to BTC”
      </p>

      <div className="flex items-center gap-2 overflow-x-auto">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => applySuggestion(s)}
            className="shrink-0 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-accent"
          >
            {s}
          </button>
        ))}
      </div>

      {hasUserMessage && (
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <div key={i} className="flex">
                {m.role === "assistant" ? (
                  <div className="ml-0 mr-auto max-w-[80%] rounded-lg border border-border/50 bg-background/50 px-4 py-3 text-sm">
                    <div className="mb-1 flex items-center gap-2 text-foreground/70">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-xs">Assistant</span>
                    </div>
                    <p className="text-foreground/90">{m.content}</p>
                  </div>
                ) : (
                  <div className="ml-auto mr-0 max-w-[80%] rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
                    <p className="text-foreground">{m.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
