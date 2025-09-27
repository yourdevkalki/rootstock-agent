import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ExecutionLogs({
  logs,
}: { logs: Array<{ timestamp: number; executor: string; txHash: string; result: "success" | "fail" }> }) {
  if (!logs?.length) {
    return (
      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>Execution Logs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-foreground/70">No executions yet.</CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader>
        <CardTitle>Execution Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.map((l, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 p-3"
          >
            <div className="text-xs text-foreground/80">{new Date(l.timestamp).toLocaleString()}</div>
            <div className="font-mono text-xs">{l.executor.slice(0, 8)}...</div>
            <a
              href={`https://explorer.testnet.rsk.co/tx/${l.txHash}`}
              target="_blank"
              rel="noreferrer"
              className={l.result === "success" ? "text-emerald-400" : "text-red-400"}
            >
              {l.result} · {l.txHash.slice(0, 10)}...
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
