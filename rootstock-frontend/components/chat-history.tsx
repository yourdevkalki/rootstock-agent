"use client"

import { useEffect, useMemo, useState } from "react"
import { Trash2, History } from "lucide-react"

type HistoryItem = {
  id: string
  prompt: string
  createdAt: number
}

const STORAGE_KEY = "rs-chat-history"

function truncateWords(text: string, words = 6) {
  return text.split(/\s+/).slice(0, words).join(" ")
}

export function ChatHistory({
  onSelect,
  className = "",
}: {
  onSelect: (text: string) => void
  className?: string
}) {
  const [items, setItems] = useState<HistoryItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  const hasItems = items.length > 0

  const sorted = useMemo(() => [...items].sort((a, b) => b.createdAt - a.createdAt), [items])

  function clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setItems([])
    } catch {
      // ignore
    }
  }

  return (
    <aside className={`rounded-md border border-border bg-card p-4 ${className}`} aria-label="Chat history">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-medium text-foreground">Chat History</h3>
        </div>
        {hasItems ? (
          <button
            type="button"
            onClick={clearHistory}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear
          </button>
        ) : null}
      </div>
      <div className="space-y-2">
        {hasItems ? (
          sorted.map((it) => (
            <button
              key={it.id}
              onClick={() => onSelect(it.prompt)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-left text-sm text-foreground hover:ring-2 hover:ring-primary"
              title={it.prompt}
            >
              {truncateWords(it.prompt, 6)}
              {it.prompt.trim().split(/\s+/).length > 6 ? "…" : ""}
            </button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Your recent prompts will appear here.</p>
        )}
      </div>
    </aside>
  )
}

// Utility for other components to add to history
export function appendToChatHistory(prompt: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const items: HistoryItem[] = raw ? JSON.parse(raw) : []
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      prompt,
      createdAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newItem, ...items].slice(0, 100)))
  } catch {
    // ignore
  }
}
