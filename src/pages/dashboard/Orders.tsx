import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button, Card, EmptyState, Input, Skeleton, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

const TABS = [
  { key: "", label: "All" },
  { key: "SUBMITTED,ACCEPTED,AWAITING_PAYMENT_AT_SHOP,READY_FOR_MANUAL_PRINT,PRINTING_MANUALLY", label: "Active" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED,FAILED,EXPIRED", label: "Closed" },
];

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const q = params.get("q") ?? "";
  const page = Number(params.get("page") ?? 1);
  const [search, setSearch] = useState(q);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", status, q, page],
    queryFn: () => api.orders({ status: status || undefined, q: q || undefined, page, page_size: 20 }),
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Print Orders</h1>
        <p className="text-sm text-muted">Manage incoming and completed print requests.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.label}
              onClick={() => setParam("status", t.key)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                status === t.key ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
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
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order, file, customer…"
                className="w-64 pl-9"
              />
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-slate-50 text-left text-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Document</th>
                    <th className="px-5 py-3 font-semibold">Pages</th>
                    <th className="px-5 py-3 font-semibold">Copies</th>
                    <th className="px-5 py-3 font-semibold">Mode</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Payment</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((o) => (
                    <tr key={o.id} className="bg-white hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link to={`/dashboard/orders/${o.id}`} className="font-semibold text-primary hover:underline">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted">{formatDate(o.created_at)}</td>
                      <td className="max-w-[160px] truncate px-5 py-3 text-slate-600">{o.original_filename}</td>
                      <td className="px-5 py-3 text-slate-600">{o.selected_page_count}/{o.total_document_pages}</td>
                      <td className="px-5 py-3 text-slate-600">{o.copies}</td>
                      <td className="px-5 py-3 text-slate-600">{o.color_mode === "BW" ? "B&W" : "Colour"} · {o.paper_size}</td>
                      <td className="px-5 py-3 font-semibold text-ink">{formatCurrency(o.total_price)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold ${o.payment_status === "PAID" ? "text-success" : "text-amber-600"}`}>
                          {o.payment_status === "PAID" ? "Paid (manual)" : "Pay at shop"}
                        </span>
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={o.print_status} /></td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/dashboard/orders/${o.id}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-muted">
              <span>{data.total} order(s)</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>Previous</Button>
                <span className="px-2 py-1.5">Page {page} / {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setParam("page", String(page + 1))}>Next</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-5">
            <EmptyState title="No orders found" description="Try a different filter or share your QR code to receive orders." />
          </div>
        )}
      </Card>
    </div>
  );
}
