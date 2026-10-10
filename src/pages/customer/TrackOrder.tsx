import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, FileWarning, MapPin, Printer } from "lucide-react";
import { Card, PageLoader, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { cn, formatCurrency, formatDate, titleCase } from "@/lib/utils";
import type { PrintStatus } from "@/types";

const FLOW: PrintStatus[] = [
  "SUBMITTED",
  "ACCEPTED",
  "AWAITING_PAYMENT_AT_SHOP",
  "READY_FOR_MANUAL_PRINT",
  "PRINTING_MANUALLY",
  "PRINTED",
  "READY_FOR_PICKUP",
  "COMPLETED",
];

export default function TrackOrderPage() {
  const { token = "" } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["track", token],
    queryFn: () => api.trackOrder(token),
    retry: false,
    refetchInterval: 15000,
  });

  if (isLoading) return <div className="grid min-h-screen place-items-center"><PageLoader /></div>;
  if (isError || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface px-4">
        <Card className="max-w-md text-center">
          <FileWarning className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-3 text-xl font-extrabold text-ink">Order not found</h1>
          <p className="mt-2 text-sm text-muted">This tracking link is invalid or has expired.</p>
        </Card>
      </div>
    );
  }

  const currentIndex = FLOW.indexOf(data.print_status);
  const terminal = ["CANCELLED", "FAILED", "EXPIRED"].includes(data.print_status);

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-secondary text-white">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <p className="text-sm text-slate-300">Order tracking</p>
          <h1 className="text-2xl font-extrabold">{data.order_number}</h1>
          <p className="mt-1 text-sm text-slate-300">{data.shop_name}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={data.print_status} />
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold">
              {data.payment_status === "PAID" ? "Paid" : "Pay at shop"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <Card>
          <p className="text-sm text-muted">Estimated amount</p>
          <p className="text-3xl font-extrabold text-primary">{formatCurrency(data.total_price, data.currency)}</p>
          <p className="mt-1 text-xs text-muted">Final amount is confirmed at the shop counter.</p>
        </Card>

        <Card>
          <h2 className="font-bold text-ink">Status</h2>
          {terminal ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              This order is {titleCase(data.print_status).toLowerCase()}.
            </p>
          ) : (
            <ol className="mt-4 space-y-0">
              {FLOW.map((step, i) => {
                const done = i <= currentIndex;
                const active = i === currentIndex;
                return (
                  <li key={step} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-full text-white",
                          done ? "bg-success" : "bg-slate-200"
                        )}
                      >
                        {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5 text-slate-400" />}
                      </span>
                      {i < FLOW.length - 1 && <span className={cn("h-6 w-0.5", done ? "bg-success/40" : "bg-slate-200")} />}
                    </div>
                    <span className={cn("pb-3 text-sm", active ? "font-bold text-ink" : done ? "text-slate-700" : "text-slate-400")}>
                      {titleCase(step)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <Card>
          <h2 className="font-bold text-ink">Order details</h2>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Submitted" value={formatDate(data.created_at)} />
            <Row label="Document pages" value={`${data.selected_page_count} of ${data.total_document_pages}`} />
            <Row label="Copies" value={data.copies} />
            <Row label="Colour" value={data.color_mode === "BW" ? "Black & White" : "Colour"} />
            <Row label="Paper" value={data.paper_size} />
            <Row label="Sides" value={data.print_sides === "DOUBLE" ? "Double-sided" : "Single-sided"} />
            {data.special_instructions && <Row label="Instructions" value={data.special_instructions} />}
            <Row
              label="Document"
              value={data.document_available ? "Available (securely stored)" : "Auto-deleted for privacy"}
            />
          </div>
          {!data.document_available && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
              This document is no longer available because it was automatically deleted for privacy.
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-bold text-ink">Collection</h2>
              <p className="mt-1 text-sm text-muted">{data.collection_instructions}</p>
              {data.shop_phone && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                  <Printer className="h-4 w-4" /> {data.shop_name} · {data.shop_phone}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-1.5 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
