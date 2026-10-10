import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee,
  Printer as PrinterIcon,
  RefreshCw,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState, PageLoader, SectionTitle, Skeleton, StatCard } from "@/components/ui";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatBytes, formatCurrency, formatDay } from "@/lib/utils";

export default function AdminDashboard() {
  const toast = useToast();
  const qc = useQueryClient();
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: api.adminStats, refetchInterval: 30000 });
  const status = useQuery({ queryKey: ["admin-system"], queryFn: api.adminSystemStatus, refetchInterval: 30000 });
  const daily = useQuery({ queryKey: ["admin-daily", 14], queryFn: () => api.adminDailyStats(14) });
  const printers = useQuery({ queryKey: ["printer-readiness"], queryFn: api.printerReadiness });

  const cleanup = useMutation({
    mutationFn: api.runCleanup,
    onSuccess: () => {
      toast.success("Cleanup finished", "Expired files removed.");
      void qc.invalidateQueries({ queryKey: ["admin-stats"] });
      void qc.invalidateQueries({ queryKey: ["admin-system"] });
    },
    onError: (e: Error) => toast.error("Cleanup failed", e.message),
  });

  if (stats.isLoading) return <PageLoader />;
  const s = stats.data;
  const sys = status.data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Platform Overview</h1>
        <p className="text-sm text-muted">Super admin dashboard for Smart Xerox.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered shops" value={s?.total_shops ?? 0} icon={<Store className="h-5 w-5" />} tone="blue" />
        <StatCard label="Pending approvals" value={s?.pending_approvals ?? 0} icon={<Clock className="h-5 w-5" />} tone="amber" />
        <StatCard label="Active shops" value={s?.active_shops ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
        <StatCard label="Suspended" value={s?.suspended_shops ?? 0} icon={<AlertOctagon className="h-5 w-5" />} tone="red" />
        <StatCard label="Print orders" value={s?.total_print_orders ?? 0} icon={<ShoppingBag className="h-5 w-5" />} tone="cyan" />
        <StatCard label="Pages requested" value={s?.total_pages_requested ?? 0} icon={<FileText className="h-5 w-5" />} tone="violet" />
        <StatCard label="Estimated value" value={formatCurrency(s?.total_estimated_value ?? 0)} hint="Estimated / manual" icon={<IndianRupee className="h-5 w-5" />} tone="green" />
        <StatCard label="Storage used" value={formatBytes(s?.storage_bytes ?? 0)} hint={`${s?.storage_objects ?? 0} objects`} icon={<FileText className="h-5 w-5" />} tone="slate" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle title="Orders in the last 14 days" />
          <div className="h-64 w-full">
            {daily.data && daily.data.points.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily.data.points} margin={{ left: -18, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="cfdg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip labelFormatter={(l) => formatDay(l as string)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="orders" stroke="#06B6D4" strokeWidth={2} fill="url(#cfdg)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No data" description="Platform analytics will appear here." />
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <SectionTitle title="System status" />
            <ul className="space-y-2 text-sm">
              <StatusRow label="Backend" ok={sys?.backend === "ok"} />
              <StatusRow label="Database" ok={sys?.database === "connected" || sys?.database === "ok"} />
              <StatusRow label="Storage" ok={(sys?.storage ?? "ok") !== "unavailable"} />
              <StatusRow label="Cleanup worker" ok={(sys?.cleanup_worker ?? "running") !== "stopped"} />
              <StatusRow label="Maintenance mode" ok={!sys?.maintenance_mode} inverted />
              {(sys?.recent_errors ?? 0) > 0 && (
                <li className="flex items-center gap-2 text-amber-600">
                  <AlertOctagon className="h-4 w-4" /> {sys?.recent_errors} recent error(s)
                </li>
              )}
              {(sys?.failed_jobs ?? 0) > 0 && (
                <li className="flex items-center gap-2 text-red-600">
                  <AlertOctagon className="h-4 w-4" /> {sys?.failed_jobs} failed job(s)
                </li>
              )}
            </ul>
            <Link to="/admin/settings">
              <Button variant="outline" className="mt-4 w-full" size="sm">Platform settings</Button>
            </Link>
          </Card>

          <Card>
            <SectionTitle title="Storage cleanup" />
            <p className="text-sm text-muted">
              Removes expired uploads, ab initio background jobs and orphaned files per the privacy policy.
            </p>
            <Button className="mt-4 w-full" variant="outline" leftIcon={<Trash2 className="h-4 w-4" />} loading={cleanup.isPending} onClick={() => cleanup.mutate()}>
              Run cleanup now
            </Button>
          </Card>

          <Card>
            <SectionTitle title="Print automation readiness" />
            {printers.data ? (
              <div className="space-y-2 text-sm">
                <p className="text-muted">{printers.data.message}</p>
                <p className="flex items-center gap-2">
                  <PrinterIcon className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-ink">{printers.data.registered_devices}</span> device(s),
                  <span className="font-semibold text-ink">{printers.data.registered_printers}</span> printer(s)
                </p>
                <Badge tone={printers.data.status === "ready" ? "green" : "amber"}>{printers.data.status}</Badge>
                <p className="mt-2 text-xs text-muted">
                  Phase 1: printers are registered for the future printer-agent; no physical printing or spooling is triggered yet.
                </p>
              </div>
            ) : (
              <Skeleton className="h-24" />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, ok, inverted }: { label: string; ok: boolean; inverted?: boolean }) {
  const good = inverted ? !ok : ok;
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={`flex items-center gap-1.5 font-semibold ${good ? "text-success" : "text-red-600"}`}>
        <span className={`h-2 w-2 rounded-full ${good ? "bg-success" : "bg-red-600"}`} />
        {good ? "OK" : "Attention"}
      </span>
    </li>
  );
}