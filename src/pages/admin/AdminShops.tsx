import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const STATUS_FILTERS = ["", "PENDING_APPROVAL", "APPROVED", "SUSPENDED", "REJECTED"];

export default function AdminShops() {
  const [params, setParams] = useSearchParams();
  const status = params.get("approval_status") ?? "";
  const q = params.get("q") ?? "";
  const [search, setSearch] = useState(q);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-shops", status, q],
    queryFn: () => api.adminShops({ approval_status: status || undefined, q: q || undefined }),
  });

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next);
  };

  const toneFor = (s: string) =>
    s === "APPROVED" ? ("green" as const) : s === "PENDING_APPROVAL" ? ("amber" as const) : s === "SUSPENDED" ? ("red" as const) : ("slate" as const);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Shops</h1>
        <p className="text-sm text-muted">Review, approve and manage all registered print shops.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s || "all"}
              onClick={() => setParam("approval_status", s)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                status === s ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s === "" ? "All" : s.replace("_", " ")}
            </button>
          ))}
          <form
            className="ml-auto flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", search.trim());
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shop or owner…" className="w-64 pl-9" />
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Shop</th>
                  <th className="px-5 py-3 font-semibold">Owner</th>
                  <th className="px-5 py-3 font-semibold">City</th>
                  <th className="px-5 py-3 font-semibold">Orders</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.map((s) => (
                  <tr key={s.id} className="bg-white hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link to={`/admin/shops/${s.id}`} className="font-semibold text-primary hover:underline">
                        {s.shop_name}
                      </Link>
                      <p className="font-mono text-xs text-slate-400">{s.public_shop_id}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {s.owner_name ?? "—"}
                      <p className="text-xs text-slate-400">{s.owner_email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{s.city ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{s.total_orders ?? 0}</td>
                    <td className="px-5 py-3"><Badge tone={toneFor(s.approval_status)}>{s.approval_status.replace("_", " ")}</Badge></td>
                    <td className="px-5 py-3 text-muted">{formatDate(s.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/admin/shops/${s.id}`}><Button size="sm" variant="outline">Review</Button></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState title="No shops found" description="Try a different filter." />
          </div>
        )}
      </Card>
    </div>
  );
}