"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWallet } from "@/lib/wallet"
import { getAvailableTokens, getSwapQuote, executeSwap, type Token } from "@/lib/tokens"
import { toast } from "sonner"

export function SwapCard() {
  const { address } = useWallet()
  const [tokens, setTokens] = useState<Token[]>([])
  const [tokenIn, setTokenIn] = useState("")
  const [tokenOut, setTokenOut] = useState("")
  const [amountIn, setAmountIn] = useState("1")
  const [quote, setQuote] = useState<string | null>(null)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    async function fetchTokens() {
      try {
        const { tokens: fetchedTokens } = await getAvailableTokens()
        setTokens(fetchedTokens)
        if (fetchedTokens.length >= 2) {
          setTokenIn(fetchedTokens[0].address)
          setTokenOut(fetchedTokens[1].address)
        }
      } catch (error) {
        console.error("Failed to fetch tokens:", error)
        toast.error("Failed to load tokens.")
      }
    }
    fetchTokens()
  }, [])

  async function handleGetQuote() {
    if (!tokenIn || !tokenOut || !amountIn) {
      toast.error("Please select tokens and enter an amount.")
      return
    }
    setIsQuoting(true)
    try {
      const { amountOut } = await getSwapQuote(tokenIn, tokenOut, amountIn)
      setQuote(amountOut)
    } catch (error) {
      console.error("Failed to get quote:", error)
      toast.error("Failed to get quote.")
    } finally {
      setIsQuoting(false)
    }
  }

  async function handleExecuteSwap() {
    if (!tokenIn || !tokenOut || !amountIn || !quote || !address) {
      toast.error("Missing required fields for swap.")
      return
    }
    setIsExecuting(true)
    try {
      await executeSwap(tokenIn, tokenOut, amountIn, quote, address)
      toast.success("Swap executed successfully!")
    } catch (error) {
      console.error("Failed to execute swap:", error)
      toast.error("Failed to execute swap.")
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>From</Label>
        <div className="flex gap-2">
          <Select value={tokenIn} onValueChange={setTokenIn}>
            <SelectTrigger><SelectValue placeholder="Select token" /></SelectTrigger>
            <SelectContent>
              {tokens.map(token => <SelectItem key={token.address} value={token.address}>{token.symbol}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" value={amountIn} onChange={e => setAmountIn(e.target.value)} placeholder="Amount" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>To</Label>
        <Select value={tokenOut} onValueChange={setTokenOut}>
          <SelectTrigger><SelectValue placeholder="Select token" /></SelectTrigger>
          <SelectContent>
            {tokens.map(token => <SelectItem key={token.address} value={token.address}>{token.symbol}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleGetQuote} disabled={isQuoting || isExecuting} className="w-full transition hover:opacity-90">
        {isQuoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isQuoting ? "Getting Quote..." : "Get Quote"}
      </Button>
      {quote && (
        <div className="text-center">
          <p>Quoted Amount Out: {quote}</p>
          <Button onClick={handleExecuteSwap} disabled={!quote || isExecuting} className="w-full mt-2 transition hover:opacity-90">
            {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isExecuting ? "Executing Swap..." : "Execute Swap"}
          </Button>
        </div>
      )}
    </div>
  )
}