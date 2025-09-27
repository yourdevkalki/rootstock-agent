import { Badge } from "@/components/ui/badge"
import type { TaskStatus } from "@/lib/tasks"

export function StatusBadge({ status }: { status: TaskStatus }) {
  const bgMap: Record<TaskStatus, string> = {
    active: "var(--accent)",
    executed: "var(--primary)",
    cancelled: "var(--accent-2)",
  }
  return (
    <Badge style={{ backgroundColor: bgMap[status], color: "var(--primary-foreground)" }} className="border-0">
      {status}
    </Badge>
  )
}
