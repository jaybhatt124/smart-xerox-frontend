import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { Badge, Card, EmptyState, PageLoader } from "@/components/ui";
import { api } from "@/lib/api";
import { cn, formatDate, titleCase } from "@/lib/utils";

const LEVELS = ["", "info", "warning", "error", "critical"];

export default function AdminLogs() {
  const [level, setLevel] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-logs", level], queryFn: () => api.adminLogs(level || undefined) });

  if (isLoading) return <PageLoader />;

  const toneFor = (l: string) =>
    l === "critical" || l === "error" ? ("red" as const) : l === "warning" ? ("amber" as const) : ("slate" as const);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Audit Log</h1>
          <p className="text-sm text-muted">Administrative actions and platform events.</p>
        </div>
        <div className="flex gap-2">
          {LEVELS.map((l) => (
            <button
              key={l || "all"}
              onClick={() => setLevel(l)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-sm font-semibold capitalize transition",
                level === l ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {l === "" ? "All" : l}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {data && data.length > 0 ? (
          <ul className="divide-y divide-line">
            {data.map((log) => (
              <li key={log.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={toneFor(log.level)}>{titleCase(log.level)}</Badge>
                  <span className="font-semibold text-ink">{log.action}</span>
                  <span className="text-xs text-slate-400">{formatDate(log.created_at)}</span>
                </div>
                {(log.actor_role || log.actor_id) && (
                  <p className="mt-1 text-xs text-slate-500">
                    {log.actor_role ? `${titleCase(log.actor_role)}` : "System"}
                    {log.actor_id ? ` (${log.actor_id})` : ""}
                  </p>
                )}
                {(log.entity_type || log.entity_id) && (
                  <p className="text-xs text-slate-400">
                    {log.entity_type ?? "—"} {log.entity_id ?? ""}
                  </p>
                )}
                {log.detail && <p className="mt-1 text-sm text-slate-600">{log.detail}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-5">
            <EmptyState icon={<ScrollText className="h-8 w-8" />} title="No log entries" description="Actions will be recorded here." />
          </div>
        )}
      </Card>
    </div>
  );
}