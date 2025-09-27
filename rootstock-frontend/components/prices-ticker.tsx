"use client"

import useSWR from "swr"
import { useEffect, useMemo, useRef, useState } from "react"

type TokenInfo = {
  id: string // coingecko id
  symbol: string
  label: string
  chain: string
  fallbackUsd: number
}

type PriceEntry = {
  id: string
  token: TokenInfo
  price: number
  timestamp: number
  key: string
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

  const [priceEntries, setPriceEntries] = useState<PriceEntry[]>([])
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Configuration constants
  const MAX_ENTRIES = 10 // Limit to 10 entries max
  const UPDATE_INTERVAL = 5000 // Update every 5 seconds (slower pace)

  const prices = useMemo(() => {
    const map = new Map<string, number>()
    TOKENS.forEach((t) => {
      const v = data?.[t.id]?.usd
      map.set(t.id, typeof v === "number" ? v : t.fallbackUsd)
    })
    return map
  }, [data])

  // Add new price entries with controlled timing and limits
  useEffect(() => {
    const addPriceEntry = () => {
      const token = TOKENS[currentTokenIndex]
      const price = prices.get(token.id) ?? token.fallbackUsd
      const timestamp = Date.now()
      
      const newEntry: PriceEntry = {
        id: token.id,
        token,
        price,
        timestamp,
        key: `${token.id}-${timestamp}`, // Unique key for animation
      }

      setPriceEntries(prev => {
        // Add new entry at the beginning and limit to MAX_ENTRIES
        const updated = [newEntry, ...prev].slice(0, MAX_ENTRIES)
        return updated
      })

      // Move to next token (random jump of 1-3 positions)
      setCurrentTokenIndex(prev => (prev + Math.ceil(Math.random() * 3)) % TOKENS.length)
    }

    // Add initial entry after a short delay
    const initialTimeout = setTimeout(addPriceEntry, 1000)

    // Then add entries at regular intervals
    const interval = setInterval(addPriceEntry, UPDATE_INTERVAL)
    
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [currentTokenIndex, prices])

  // Auto-scroll to top when new entries are added
  useEffect(() => {
    if (scrollContainerRef.current && priceEntries.length > 0) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }, [priceEntries])

  return (
    <aside className={`flex flex-col h-[calc(100vh-6rem)] rounded-md border border-border bg-card ${className}`} aria-label="Live prices">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Live Prices</h3>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {priceEntries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading prices...</p>
          </div>
        ) : (
          priceEntries.map((entry, index) => (
            <div
              key={entry.key}
              className={`rounded-lg border border-border bg-background p-4 animate-in fade-in slide-in-from-top-2 ${
                index === 0 ? 'ring-2 ring-primary/20' : ''
              }`}
              style={{ 
                animationDuration: "500ms",
                animationDelay: `${index * 50}ms`
              } as any}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{entry.token.chain}</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {entry.token.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({entry.token.symbol})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    ${entry.price.toLocaleString(undefined, {
                      minimumFractionDigits: entry.price < 1 ? 4 : 0,
                      maximumFractionDigits: entry.price < 1 ? 4 : 0,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleTimeString(undefined, {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              {/* Price change indicator */}
              {index > 0 && priceEntries[index].token.id === priceEntries[index - 1]?.token.id && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  {(() => {
                    const prevPrice = priceEntries[index - 1].price
                    const change = entry.price - prevPrice
                    const changePercent = ((change / prevPrice) * 100)
                    return (
                      <div className={`text-xs flex items-center justify-between ${
                        change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'
                      }`}>
                        <span>
                          {change > 0 ? '↗' : change < 0 ? '↘' : '→'} 
                          {change > 0 ? '+' : ''}${change.toFixed(2)}
                        </span>
                        <span>
                          {change > 0 ? '+' : ''}{changePercent.toFixed(2)}%
                        </span>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}