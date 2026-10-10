import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee,
  Layers,
  Pause,
  Play,
  ShoppingBag,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Button, Card, EmptyState, SectionTitle, Skeleton, StatCard, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, formatDay } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { useNewOrderWatcher } from "@/hooks/useNewOrders";

function ApprovalBanner({ status, reason }: { status: string; reason?: string | null }) {
  if (status === "APPROVED") return null;
  const map: Record<string, { tone: string; title: string; text: string }> = {
    PENDING_APPROVAL: {
      tone: "amber",
      title: "Your shop is pending approval",
      text: "A platform administrator will review your shop shortly. You can configure pricing and your profile in the meantime.",
    },
    REJECTED: {
      tone: "red",
      title: "Your shop registration was rejected",
      text: reason || "Please contact support for more details and to re-submit.",
    },
    SUSPENDED: {
      tone: "red",
      title: "Your shop is suspended",
      text: "Your shop cannot receive orders while suspended. Please contact support.",
    },
  };
  const info = map[status] ?? map.PENDING_APPROVAL;
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${
        info.tone === "amber" ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"
      }`}
    >
      <AlertTriangle className={`mt-0.5 h-5 w-5 ${info.tone === "amber" ? "text-amber-600" : "text-red-600"}`} />
      <div>
        <p className="font-semibold text-ink">{info.title}</p>
        <p className="text-sm text-muted">{info.text}</p>
      </div>
    </div>
  );
}

export default function Overview() {
  const qc = useQueryClient();
  const toast = useToast();
  useNewOrderWatcher(true);

  const shopQuery = useQuery({ queryKey: ["my-shop"], queryFn: api.myShop });
  const overviewQuery = useQuery({ queryKey: ["overview"], queryFn: api.overview, refetchInterval: 20000 });
  const dailyQuery = useQuery({ queryKey: ["daily", 14], queryFn: () => api.dailyStats(14) });
  const ordersQuery = useQuery({ queryKey: ["orders", "recent"], queryFn: () => api.orders({ page: 1, page_size: 6 }) });

  const toggle = useMutation({
    mutationFn: (accepting: boolean) => api.setAccepting(accepting),
    onSuccess: (_d, v) => {
      toast.success(v ? "Now accepting orders" : "Orders paused");
      void qc.invalidateQueries({ queryKey: ["my-shop"] });
      void qc.invalidateQueries({ queryKey: ["public-shop"] });
    },
  });

  const shop = shopQuery.data;
  const overview = overviewQuery.data;
  const approved = shop?.approval_status === "APPROVED";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{shop?.shop_name ?? "Dashboard"}</h1>
          <p className="text-sm text-muted">Overview of your printing business.</p>
        </div>
        {approved && (
          <Button
            variant={shop?.accepting_orders ? "outline" : "success"}
            loading={toggle.isPending}
            leftIcon={shop?.accepting_orders ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            onClick={() => toggle.mutate(!shop?.accepting_orders)}
          >
            {shop?.accepting_orders ? "Pause orders" : "Resume orders"}
          </Button>
        )}
      </div>

      {shop && <ApprovalBanner status={shop.approval_status} reason={shop.rejection_reason} />}

      {overviewQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Orders today" value={overview?.orders_today ?? 0} icon={<ShoppingBag className="h-5 w-5" />} tone="blue" />
          <StatCard label="Pending orders" value={overview?.pending_orders ?? 0} icon={<Clock className="h-5 w-5" />} tone="amber" />
          <StatCard label="Printed orders" value={overview?.printed_orders ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} tone="cyan" />
          <StatCard label="Completed" value={overview?.completed_orders ?? 0} icon={<Layers className="h-5 w-5" />} tone="green" />
          <StatCard label="Pages requested" value={overview?.total_pages_requested ?? 0} icon={<FileText className="h-5 w-5" />} tone="violet" />
          <StatCard
            label="Estimated revenue"
            value={formatCurrency(overview?.estimated_revenue ?? 0)}
            hint="Estimated / manual — not gateway-verified"
            icon={<IndianRupee className="h-5 w-5" />}
            tone="green"
          />
          <StatCard label="Active requests" value={overview?.active_print_requests ?? 0} icon={<Clock className="h-5 w-5" />} tone="blue" />
          <StatCard label="Avg. order value" value={formatCurrency(overview?.average_order_value ?? 0)} icon={<IndianRupee className="h-5 w-5" />} tone="slate" />
        </div>
      )}

      <Card>
        <SectionTitle title="Orders in the last 14 days" subtitle="Volume trend for your shop" />
        <div className="h-64 w-full">
          {dailyQuery.data && dailyQuery.data.points.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyQuery.data.points} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="orders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(l) => formatDay(l as string)}
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="orders" stroke="#2563EB" strokeWidth={2} fill="url(#orders)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No orders yet" description="Orders will appear here once customers start submitting." />
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Recent orders"
          action={<Link to="/dashboard/orders"><Button variant="outline" size="sm">View all</Button></Link>}
        />
        {ordersQuery.data && ordersQuery.data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 pr-4 font-semibold">Order</th>
                  <th className="py-2 pr-4 font-semibold">Document</th>
                  <th className="py-2 pr-4 font-semibold">Pages</th>
                  <th className="py-2 pr-4 font-semibold">Amount</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ordersQuery.data.items.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-4">
                      <Link to={`/dashboard/orders/${o.id}`} className="font-semibold text-primary hover:underline">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="max-w-[180px] truncate py-2.5 pr-4 text-slate-600">{o.original_filename}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{o.selected_page_count} × {o.copies}</td>
                    <td className="py-2.5 pr-4 font-semibold text-ink">{formatCurrency(o.total_price)}</td>
                    <td className="py-2.5 pr-4"><StatusBadge status={o.print_status} /></td>
                    <td className="py-2.5 text-muted">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No orders yet" description="Share your shop QR code to start receiving print requests." />
        )}
      </Card>
    </div>
  );
}
