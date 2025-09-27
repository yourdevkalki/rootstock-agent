"use client"

import { useState } from "react"
import { TaskForm } from "@/components/task-form"
import { ChatCreateTask } from "@/components/chat-create-task"
import { ChatHistory } from "@/components/chat-history"
import { PricesTicker } from "@/components/prices-ticker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CreateTaskPage() {
  const [chatInput, setChatInput] = useState("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6 px-4 py-10 min-h-[calc(100vh-4rem)]">
      {/* Left Sidebar */}
      <div className="hidden lg:block">
        <ChatHistory onSelect={setChatInput} className="sticky top-24" />
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold tracking-tight">Create Task</h2>
          <p className="text-sm text-foreground/70">
            Use natural language or the structured form. Both create the same tasks.
          </p>
        </div>

        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="mx-auto mb-4">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="form">Form</TabsTrigger>
          </TabsList>

          <div className="flex-1 flex flex-col">
            <TabsContent value="chat" className="flex-1 flex flex-col justify-end">
              <ChatCreateTask input={chatInput} setInput={setChatInput} />
            </TabsContent>

            <TabsContent value="form" className="flex-1">
              <TaskForm />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block">
        <PricesTicker className="sticky top-24" />
      </div>
    </div>
  );
}
