"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { getTask } from "@/lib/tasks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { ExecutionLogs } from "@/components/execution-logs"

const fetcher = (id: string) => getTask(id)

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data: task } = useSWR(id ? ["task", id] : null, () => fetcher(id))

  if (!task) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-xl border border-border/60 bg-card/70 p-6">Loading task...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-wider">Task {task.id.slice(0, 8)}</h1>
        <StatusBadge status={task.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-foreground/70">Type:</span> <span className="capitalize">{task.type}</span>
            </div>
            <div>
              <span className="text-foreground/70">Action:</span> <span className="capitalize">{task.action}</span>
            </div>
            <div>
              <span className="text-foreground/70">Condition:</span>{" "}
              <span className="text-xs">
                {task.type === "time"
                  ? `Every ${task.condition.intervalHours}h`
                  : `${task.condition.token} ${task.condition.direction} ${task.condition.threshold}`}
              </span>
            </div>
            <div>
              <span className="text-foreground/70">Funds:</span> {task.funds.amount} {task.funds.token}
            </div>
            <div className="text-xs text-foreground/70">Created: {new Date(task.createdAt).toLocaleString()}</div>
          </CardContent>
        </Card>

        <ExecutionLogs logs={task.history} />
      </div>
    </div>
  )
}
