"use client"

import { useEffect, useMemo, useState } from "react"
import { Trash2, History } from "lucide-react"

type HistoryItem = {
  id: string
  userPrompt: string
  assistantResponse: string
  createdAt: number
}

const STORAGE_KEY = "rs-chat-history"

function truncateWords(text: string | undefined | null, words = 6) {
  if (!text || typeof text !== 'string') {
    return ""
  }
  return text.split(/\s+/).slice(0, words).join(" ")
}

export function ChatHistory({
  onSelect,
  className = "",
}: {
  onSelect: (item: HistoryItem) => void
  className?: string
}) {
  const [items, setItems] = useState<HistoryItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsedItems = JSON.parse(raw)
        // Validate the parsed data structure
        if (Array.isArray(parsedItems)) {
          const validItems = parsedItems.filter(item => 
            item && 
            typeof item === 'object' && 
            typeof item.userPrompt === 'string' && 
            typeof item.assistantResponse === 'string' &&
            typeof item.createdAt === 'number'
          )
          setItems(validItems)
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Listen for storage changes to update in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsedItems = JSON.parse(raw)
          if (Array.isArray(parsedItems)) {
            const validItems = parsedItems.filter(item => 
              item && 
              typeof item === 'object' && 
              typeof item.userPrompt === 'string' && 
              typeof item.assistantResponse === 'string' &&
              typeof item.createdAt === 'number'
            )
            setItems(validItems)
          }
        }
      } catch (error) {
        console.error('Error updating chat history:', error)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom events for same-tab updates
    window.addEventListener('chatHistoryUpdated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('chatHistoryUpdated', handleStorageChange)
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
    <aside className={`flex flex-col h-[calc(100vh-6rem)] rounded-md border border-border bg-card ${className}`} aria-label="Chat history">
      <div className="flex items-center justify-between p-4 border-b border-border">
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
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {hasItems ? (
            sorted.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-left text-sm text-foreground hover:ring-2 hover:ring-primary transition-all"
                title={item.userPrompt || "No prompt available"}
              >
                <div className="font-medium">
                  {truncateWords(item.userPrompt, 6)}
                  {(item.userPrompt?.trim().split(/\s+/).length || 0) > 6 ? "…" : ""}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Your recent prompts will appear here.</p>
          )}
        </div>
      </div>
    </aside>
  )
}

// Updated utility function to store both prompt and response with validation
export function appendToChatHistory(userPrompt: string, assistantResponse: string) {
  try {
    // Validate inputs
    if (!userPrompt || typeof userPrompt !== 'string') {
      console.warn('Invalid userPrompt provided to appendToChatHistory')
      return
    }
    
    if (!assistantResponse || typeof assistantResponse !== 'string') {
      console.warn('Invalid assistantResponse provided to appendToChatHistory')
      return
    }
    
    const raw = localStorage.getItem(STORAGE_KEY)
    const items: HistoryItem[] = raw ? JSON.parse(raw) : []
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      userPrompt: userPrompt.trim(),
      assistantResponse: assistantResponse.trim(),
      createdAt: Date.now(),
    }
    const updatedItems = [newItem, ...items].slice(0, 100)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems))
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new CustomEvent('chatHistoryUpdated'))
  } catch (error) {
    console.error('Error saving to chat history:', error)
  }
}