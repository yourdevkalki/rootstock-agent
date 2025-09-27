"use client"

import useSWR from "swr"
import { getTasks, cancelTask, type Task } from "@/lib/tasks"
import { Button } from "@/components/ui/button"
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { StatusBadge } from "./status-badge"
import Link from "next/link"
import { toast } from "sonner"
import { ethers } from "ethers"

// Helper to transform the raw backend task into the frontend format
function transformTask(task: any, index: number): Task {
  const { resolverType, resolverData, active } = task
  const id = index.toString()
  let type: "time" | "price" = "time"
  let condition: any = {}

  if (resolverType === 0) { // Time-based
    type = "time"
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], resolverData)
    condition.intervalHours = Number(decoded[0]) / 3600
  } else { // Price-based
    type = "price"
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["bytes32", "uint8", "uint64", "int8"], resolverData)
    condition.token = decoded[0] // This is the priceId
    condition.direction = decoded[1] === 1 ? "above" : "below"
    condition.threshold = Number(decoded[2]) / 100 // Assuming 2 decimal places
  }

  return {
    ...task,
    id,
    type,
    condition,
    status: active ? "active" : "cancelled",
    // These are placeholder values as they are not available from the backend yet
    action: "swap",
    funds: { amount: 0, token: "N/A" },
    createdAt: 0,
    history: [],
  }
}

const fetcher = async () => {
  const tasks = await getTasks()
  return tasks.map(transformTask)
}

export function TaskTable() {
  const { data, mutate } = useSWR("tasks", fetcher, { revalidateOnFocus: false })
  const tasks = data ?? []

  async function onCancel(id: string) {
    await cancelTask(id)
    toast("Task cancelled")
    mutate()
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
