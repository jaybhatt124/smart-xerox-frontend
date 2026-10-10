import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, EmptyState, PageLoader, StatCard } from "@/components/ui";
import { api } from "@/lib/api";
import { cn, formatCurrency, formatDay } from "@/lib/utils";

const RANGES = [7, 30, 90];

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({ queryKey: ["admin-daily", days], queryFn: () => api.adminDailyStats(days) });

  if (isLoading) return <PageLoader />;
  const points = data?.points ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Platform Analytics</h1>
          <p className="text-sm text-muted">Aggregated across all shops.</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                days === r ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total orders" value={data?.total_orders ?? 0} tone="blue" />
        <StatCard label="Total pages" value={data?.total_pages ?? 0} tone="violet" />
        <StatCard
          label="Estimated revenue"
          value={formatCurrency(data?.total_revenue ?? 0)}
          hint="Estimated / manual collections"
          tone="green"
        />
      </div>

      <Card>
        <h2 className="mb-4 font-bold text-ink">Orders &amp; pages</h2>
        <div className="h-72 w-full">
          {points.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip labelFormatter={(l) => formatDay(l as string)} contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="orders" name="Orders" stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pages" name="Pages" stroke="#06B6D4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No data for this period" description="Analytics appear once orders are received." />
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-bold text-ink">Estimated revenue</h2>
        <div className="h-72 w-full">
          {points.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip
                  labelFormatter={(l) => formatDay(l as string)}
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#16A34A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No revenue data" description="Revenue is estimated from received orders." />
          )}
        </div>
      </Card>
    </div>
  );
}