"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { type Task, useTasks,  transformTask } from "@/lib/tasks"
import { useWallet } from "@/lib/wallet"
import { StatusBadge } from "./status-badge"
import { ethers } from "ethers"
import { useEffect, useState } from "react"

function fmtFunds(f: Task["funds"]) {
  return `${f.amount} ${f.token}`
}

export function TasksTable() {
  const { address } = useWallet()
  // We need to transform the data after fetching
  const { tasks, isLoading, setCancelled } = useTasks(address || undefined)

  if (!address) return <div className="text-sm text-foreground/70">Connect your wallet to see your tasks.</div>
  if (isLoading) return <div className="text-sm text-foreground/70">Loading tasks…</div>
  if (!tasks.length) return <div className="text-sm text-foreground/70">No tasks yet. Create your first task.</div>

  return (
    <div className="overflow-hidden card-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-foreground/60">
            <tr className="border-b border-foreground/10">
              <th className="px-4 py-3">Task ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Funds</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-b border-foreground/10 hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                <td className="px-4 py-3">{t.type}</td>
                <td className="px-4 py-3">
                  {t.type === "time"
                    ? `Every ${t.condition.intervalHours}h`
                    : `${t.condition.token?.slice(0, 8)}... ${t.condition.direction} ${t.condition.threshold}`}
                </td>
                <td className="px-4 py-3">{t.action}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3">{fmtFunds(t.funds)}</td>
                <td className="px-4 py-3 flex gap-2">
                  <Link href={`/tasks/${t.id}`}>
                    <Button size="sm" variant="outline" className="border-foreground/15 bg-transparent">
                      Details
                    </Button>
                  </Link>
                  {t.status === "active" && (
                    <Button size="sm" className="btn-gradient" onClick={() => setCancelled(t.id)}>
                      Cancel
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
