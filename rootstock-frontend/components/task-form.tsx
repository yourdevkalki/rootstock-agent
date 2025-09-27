"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTask, type TaskType } from "@/lib/tasks"
import { getAvailableTokens, type Token } from "@/lib/tokens"

export function TaskForm() {
  const router = useRouter()
  const [type, setType] = useState<TaskType>("time")
  const [intervalHours, setIntervalHours] = useState(24)
  const [priceToken, setPriceToken] = useState("")
  const [threshold, setThreshold] = useState<number>(1)
  const [direction, setDirection] = useState<"above" | "below">("above")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  // Swap action states
  const [swapTokenIn, setSwapTokenIn] = useState("")
  const [swapTokenOut, setSwapTokenOut] = useState("")
  const [swapAmountIn, setSwapAmountIn] = useState("1")
  const [tokens, setTokens] = useState<Token[]>([])

  // Fetch available tokens for swapping
  useEffect(() => {
    async function fetchTokens() {
      try {
        const { tokens: fetchedTokens } = await getAvailableTokens()
        setTokens(fetchedTokens)
        if (fetchedTokens.length >= 2) {
          setSwapTokenIn(fetchedTokens[0].address)
          setSwapTokenOut(fetchedTokens[1].address)
          setPriceToken(fetchedTokens[0].address)
        }
      } catch (error) {
        console.error("Failed to fetch tokens:", error)
        toast.error("Could not load available tokens for swapping.")
      }
    }
    fetchTokens()
  }, [])

  // Form validation
  useEffect(() => {
    let isValid = false
    if (type === "time") {
      isValid = intervalHours > 0 && !!swapTokenIn && !!swapTokenOut && parseFloat(swapAmountIn) > 0
    } else {
      isValid = !!priceToken && !!direction && threshold > 0 && !!swapTokenIn && !!swapTokenOut && parseFloat(swapAmountIn) > 0
    }
    setIsFormValid(isValid)
  }, [type, intervalHours, priceToken, direction, threshold, swapTokenIn, swapTokenOut, swapAmountIn])

  async function onSubmit(e: React.FormEvent) {
    console.log("Submit clicked")
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createTask({
        type,
        condition: type === "time" ? { intervalHours } : { token: priceToken, threshold: Number(threshold), direction },
        swap: { tokenIn: swapTokenIn, tokenOut: swapTokenOut, amountIn: swapAmountIn },
      })
      toast.success("Task created successfully!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Failed to create task:", error)
      toast.error("Failed to create task", { description: error.message || "An unknown error occurred." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-8 rounded-xl border border-border/60 bg-card/70 p-8">
      <div>
        <h2 className="text-xl font-medium tracking-wider">Create an Automated Swap</h2>
        <p className="text-sm text-foreground/70">Schedule a swap to be executed automatically when a specific condition is met.</p>
      </div>

      {/* Step 1: Trigger Condition */}
      <div className="space-y-4 rounded-lg border border-border/40 p-4">
        <h3 className="text-lg font-medium">1. Choose the Trigger</h3>
        <p className="text-xs text-foreground/60">When should this swap be executed?</p>
        <RadioGroup defaultValue="time" value={type} onValueChange={(v: TaskType) => setType(v)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <RadioGroupItem value="time" id="time" className="peer sr-only" />
            <Label htmlFor="time" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
              At a Regular Interval
            </Label>
          </div>
          <div>
            <RadioGroupItem value="price" id="price" className="peer sr-only" />
            <Label htmlFor="price" className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
              When a Price Changes
            </Label>
          </div>
        </RadioGroup>

        {type === "time" ? (
          <div className="space-y-2 pt-4">
            <Label>Interval (in hours)</Label>
            <Input type="number" min={1} value={intervalHours} onChange={(e) => setIntervalHours(Number(e.target.value))} />
            <p className="text-xs text-foreground/60">The swap will be executed every {intervalHours} hour(s).</p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-3 items-end gap-2">
              <div className="space-y-2">
                <Label>Token</Label>
                <Select value={priceToken} onValueChange={setPriceToken}>
                  <SelectTrigger><SelectValue placeholder="Token" /></SelectTrigger>
                  <SelectContent>
                    {tokens.map(token => <SelectItem key={token.address} value={token.address}>{token.symbol}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select value={direction} onValueChange={(v: "above" | "below") => setDirection(v)}>
                  <SelectTrigger><SelectValue placeholder="Direction" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Rises Above</SelectItem>
                    <SelectItem value="below">Drops Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Price</Label>
                <Input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
              </div>
            </div>
            <p className="text-xs text-foreground/60">The swap will execute when {priceToken} {direction === 'above' ? 'rises above' : 'drops below'} ${threshold}.</p>
          </div>
        )}
      </div>

      {/* Step 2: Swap Action */}
      <div className="space-y-4 rounded-lg border border-border/40 p-4">
        <h3 className="text-lg font-medium">2. Define the Swap</h3>
        <p className="text-xs text-foreground/60">What swap should be performed when the trigger condition is met?</p>
        <div className="space-y-2">
          <Label>From</Label>
          <div className="flex gap-2">
            <Select value={swapTokenIn} onValueChange={setSwapTokenIn}>
              <SelectTrigger><SelectValue placeholder="Select token" /></SelectTrigger>
              <SelectContent>
                {tokens.map(token => <SelectItem key={token.address} value={token.address}>{token.symbol}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" value={swapAmountIn} onChange={e => setSwapAmountIn(e.target.value)} placeholder="Amount" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>To</Label>
          <Select value={swapTokenOut} onValueChange={setSwapTokenOut}>
            <SelectTrigger><SelectValue placeholder="Select token" /></SelectTrigger>
            <SelectContent>
              {tokens
                .filter(token => token.address.toLowerCase() !== swapTokenIn.toLowerCase())
                .map(token => <SelectItem key={token.address} value={token.address}>{token.symbol}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={!isFormValid || isSubmitting} className="btn-gradient neon-glow w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? "Scheduling..." : "Schedule Automated Swap"}
      </Button>
    </form>
  )
}
