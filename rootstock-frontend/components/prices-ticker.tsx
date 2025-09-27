"use client"

import useSWR from "swr"
import { useEffect, useMemo, useState } from "react"

type TokenInfo = {
  id: string // coingecko id
  symbol: string
  label: string
  chain: string
  fallbackUsd: number
}

const TOKENS: TokenInfo[] = [
  { id: "bitcoin", symbol: "BTC", label: "Bitcoin", chain: "Bitcoin", fallbackUsd: 58000 },
  { id: "ethereum", symbol: "ETH", label: "Ethereum", chain: "Ethereum", fallbackUsd: 2500 },
  { id: "tether", symbol: "USDT", label: "Tether", chain: "Ethereum", fallbackUsd: 1 },
  { id: "usd-coin", symbol: "USDC", label: "USD Coin", chain: "Ethereum", fallbackUsd: 1 },
  { id: "binancecoin", symbol: "BNB", label: "BNB", chain: "BNB Chain", fallbackUsd: 300 },
  { id: "solana", symbol: "SOL", label: "Solana", chain: "Solana", fallbackUsd: 100 },
  { id: "avalanche-2", symbol: "AVAX", label: "Avalanche", chain: "Avalanche", fallbackUsd: 30 },
  { id: "polygon-pos", symbol: "MATIC", label: "Polygon", chain: "Polygon", fallbackUsd: 0.8 },
  { id: "arbitrum", symbol: "ARB", label: "Arbitrum", chain: "Arbitrum", fallbackUsd: 1.2 },
  { id: "optimism", symbol: "OP", label: "Optimism", chain: "Optimism", fallbackUsd: 2 },
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PricesTicker({ className = "" }: { className?: string }) {
  const ids = useMemo(() => TOKENS.map((t) => t.id).join(","), [])
  const { data } = useSWR<Record<string, { usd: number }>>(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd`,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
      shouldRetryOnError: true,
    },
  )

  const prices = useMemo(() => {
    const map = new Map<string, number>()
    TOKENS.forEach((t) => {
      const v = data?.[t.id]?.usd
      map.set(t.id, typeof v === "number" ? v : t.fallbackUsd)
    })
    return map
  }, [data])

  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + Math.ceil(Math.random() * 3)) % TOKENS.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const t = TOKENS[index]
  const price = prices.get(t.id) ?? t.fallbackUsd

  return (
    <aside className={`rounded-md border border-border bg-card p-4 ${className}`} aria-label="Live prices">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Live Prices</h3>
        <span className="text-xs text-muted-foreground">updates every 5s</span>
      </div>
      <div className="relative h-24 overflow-hidden">
        <div
          key={`${t.id}-${price}`}
          className="absolute inset-0 animate-in fade-in zoom-in rounded-lg border border-border bg-background p-4"
          style={{ animationDuration: "300ms" } as any}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t.chain}</p>
              <p className="text-base font-semibold text-foreground">
                {t.label} <span className="text-muted-foreground text-sm">({t.symbol})</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">${price.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">USD</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
