import { TaskTable } from "@/components/task-table"

export default function DashboardPage() {
  return (
    <div className="px-4 py-10">
      <h1 className="mb-4 text-2xl font-medium tracking-wider">Your Tasks</h1>
      <TaskTable />
    </div>
  )
}
