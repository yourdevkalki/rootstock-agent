"use client"

import { TaskForm } from "@/components/task-form"
import { ChatCreateTask } from "@/components/chat-create-task"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CreateTaskPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col min-h-screen">
      {/* Heading centered */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold tracking-tight">Create Task</h2>
        <p className="text-sm text-foreground/70">
          Use natural language or the structured form. Both create the same tasks.
        </p>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        {/* Tabs triggers centered */}
        <TabsList className="mx-auto mb-4">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="form">Form</TabsTrigger>
        </TabsList>

        {/* Tab content */}
        <div className="flex-1 flex flex-col">
          {/* Chat tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col justify-between">
            {/* Scrollable area for messages */}
            <div className="flex-1 overflow-y-auto mb-4">
              {/* Here you can render previous messages if any */}
            </div>

            {/* Chat input pinned at bottom */}
            <ChatCreateTask />
          </TabsContent>

          {/* Form tab */}
          <TabsContent value="form" className="flex-1">
            <TaskForm />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
