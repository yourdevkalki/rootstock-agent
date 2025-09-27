"use client"

import { type Task, useTasks } from "@/lib/tasks"
import { Button } from "@/components/ui/button"
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { StatusBadge } from "./status-badge"
import Link from "next/link"
import { toast } from "sonner"

export function TaskTable() {
  const { tasks, isLoading, error, setCancelled } = useTasks()

  console.log("TaskTable render:", { tasks, isLoading, error });

  async function onCancel(id: string) {
    try {
      await setCancelled(id)
      toast("Task cancelled")
    } catch (error) {
      console.error("Cancel error:", error);
      toast("Failed to cancel task")
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/70 p-6 text-center text-sm text-foreground/80">
        Loading tasks...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/70 p-6 text-center text-sm text-red-500">
        Error loading tasks: {error.message}
      </div>
    )
  }

  if (!tasks.length) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/70 p-6 text-center text-sm text-foreground/80">
        No tasks yet. Create one to get started.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Funds</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t: Task) => (
            <TableRow key={t.id} className="hover:bg-muted/40">
              <TableCell className="font-mono text-xs">{t.id}</TableCell>
              <TableCell className="capitalize">{t.type}</TableCell>
              <TableCell className="text-xs">
                {t.type === "time"
                  ? `Every ${t.condition.intervalHours}h`
                  : `${t.condition.token?.slice(0, 8)}... ${t.condition.direction} ${t.condition.threshold}`}
              </TableCell>
              <TableCell className="capitalize">{t.action}</TableCell>
              <TableCell>
                <StatusBadge status={t.status} />
              </TableCell>
              <TableCell className="text-xs">
                {t.funds.amount} {t.funds.token}
              </TableCell>
              <TableCell className="flex gap-2">
                <Link href={`/tasks/${t.id}`}>
                  <Button size="sm" variant="secondary">
                    Details
                  </Button>
                </Link>
                {t.status === "active" && (
                  <Button size="sm" variant="destructive" onClick={() => onCancel(t.id)}>
                    Cancel
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}