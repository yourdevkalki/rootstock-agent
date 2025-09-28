"use client"

import { useState } from "react"
import { TaskForm } from "@/components/task-form"
import { ChatCreateTask } from "@/components/chat-create-task"
import { ChatHistory } from "@/components/chat-history"
import { PricesTicker } from "@/components/prices-ticker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type HistoryItem = {
  id: string
  userPrompt: string
  assistantResponse: string
  createdAt: number
}

export default function CreateTaskPage() {
  const [chatInput, setChatInput] = useState("")
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null)

  const handleHistorySelect = (item: HistoryItem) => {
    setSelectedHistoryItem(item)
    setChatInput("") // Clear current input
  }

  const clearSelectedHistory = () => {
    setSelectedHistoryItem(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6 px-4 py-6 min-h-[calc(100vh-4rem)]">
      {/* Left Sidebar - Chat History */}
      <div className="hidden lg:block">
        <ChatHistory 
          onSelect={handleHistorySelect} 
          className="sticky top-6" 
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col min-h-0">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold tracking-tight">Create Automation</h2>
          <p className="text-sm text-foreground/70">
            Use natural language or the structured form. Both create the same tasks.
          </p>
        </div>

        <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <TabsContent value="chat" className="flex-1 flex flex-col justify-end min-h-0">
              <ChatCreateTask 
                input={chatInput} 
                setInput={setChatInput}
                selectedHistoryItem={selectedHistoryItem}
                onClearHistory={clearSelectedHistory}
              />
            </TabsContent>

            <TabsContent value="form" className="flex-1 overflow-y-auto">
              <TaskForm />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Right Sidebar - Prices Ticker */}
      <div className="hidden lg:block">
        <PricesTicker className="sticky top-6" />
      </div>
    </div>
  );
}
