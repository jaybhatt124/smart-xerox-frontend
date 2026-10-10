import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  FileWarning,
  IndianRupee,
  Printer as PrinterIcon,
  X,
} from "lucide-react";
import { Button, Card, Modal, PageLoader, Skeleton, StatusBadge } from "@/components/ui";
import { api, fileUrl } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatBytes, formatCurrency, formatDate, titleCase } from "@/lib/utils";
import type { PrintStatus } from "@/types";

const TRANSITIONS: Record<string, { label: string; to: PrintStatus; variant: "primary" | "success" | "accent" | "outline" }[]> = {
  SUBMITTED: [
    { label: "Accept order", to: "ACCEPTED", variant: "primary" },
    { label: "Mark awaiting payment", to: "AWAITING_PAYMENT_AT_SHOP", variant: "outline" },
  ],
  ACCEPTED: [
    { label: "Awaiting payment", to: "AWAITING_PAYMENT_AT_SHOP", variant: "outline" },
    { label: "Ready for print", to: "READY_FOR_MANUAL_PRINT", variant: "primary" },
  ],
  AWAITING_PAYMENT_AT_SHOP: [
    { label: "Ready for print", to: "READY_FOR_MANUAL_PRINT", variant: "primary" },
  ],
  READY_FOR_MANUAL_PRINT: [
    { label: "Start manual printing", to: "PRINTING_MANUALLY", variant: "accent" },
  ],
  PRINTING_MANUALLY: [
    { label: "Mark printed", to: "PRINTED", variant: "success" },
  ],
  PRINTED: [
    { label: "Ready for pickup", to: "READY_FOR_PICKUP", variant: "primary" },
    { label: "Mark completed", to: "COMPLETED", variant: "success" },
  ],
  READY_FOR_PICKUP: [{ label: "Mark completed", to: "COMPLETED", variant: "success" }],
};

export default function OrderDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payNote, setPayNote] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.order(id),
    refetchInterval: 20000,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["order", id] });
    void qc.invalidateQueries({ queryKey: ["orders"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ to, note }: { to: PrintStatus; note?: string }) => api.updateOrderStatus(id, to, note),
    onSuccess: (o) => {
      toast.success("Status updated", `Now: ${titleCase(o.print_status)}`);
      invalidate();
    },
    onError: (e: Error) => toast.error("Could not update status", e.message),
  });

  const payMutation = useMutation({
    mutationFn: () => api.recordPayment(id, undefined, payNote || undefined),
    onSuccess: () => {
      toast.success("Payment recorded", "Marked as paid (manual entry — not gateway-verified).");
      setPayOpen(false);
      setPayNote("");
      invalidate();
    },
    onError: (e: Error) => toast.error("Could not record payment", e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelOrder(id, "Cancelled by shop"),
    onSuccess: () => {
      toast.info("Order cancelled");
      invalidate();
    },
    onError: (e: Error) => toast.error("Could not cancel", e.message),
  });

  const openPreview = async () => {
    setPreviewError(null);
    setPreviewOpen(true);
    setPreviewUrl(null);
    try {
      const urls = await api.orderDocumentUrl(id);
      setPreviewUrl(fileUrl(urls.preview_url) ?? null);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Document unavailable.");
    }
  };

  const download = async () => {
    try {
      const urls = await api.orderDocumentUrl(id);
      window.open(fileUrl(urls.download_url), "_blank");
    } catch (e) {
      toast.error("Download failed", e instanceof Error ? e.message : "Document unavailable.");
    }
  };

  if (isLoading) return <PageLoader />;
  if (!order) return <Card>Order not found.</Card>;

  const actions = TRANSITIONS[order.print_status] ?? [];
  const terminal = ["COMPLETED", "CANCELLED", "FAILED", "EXPIRED"].includes(order.print_status);

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-ink">{order.order_number}</h1>
            <StatusBadge status={order.print_status} />
          </div>
          <p className="text-sm text-muted">Created {formatDate(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          {!order.document_deleted && (
            <>
              <Button variant="outline" leftIcon={<Eye className="h-4 w-4" />} onClick={openPreview}>Preview</Button>
              <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={download}>Download</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <h2 className="font-bold text-ink">Document &amp; printing</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="File" value={order.original_filename ?? "—"} />
              <Info label="File size" value={order.file_size ? formatBytes(order.file_size) : "—"} />
              <Info label="Total pages" value={order.total_document_pages} />
              <Info label="Selected pages" value={`${order.selected_page_count} (${order.selected_page_ranges})`} />
              <Info label="Copies" value={order.copies} />
              <Info label="Colour" value={order.color_mode === "BW" ? "Black & White" : "Colour"} />
              <Info label="Paper" value={order.paper_size} />
              <Info label="Sides" value={order.print_sides === "DOUBLE" ? "Double-sided" : "Single-sided"} />
              <Info label="Orientation" value={titleCase(order.orientation)} />
              <Info label="Fitting" value={titleCase(order.fitting_mode)} />
              {order.customer_name && <Info label="Customer" value={order.customer_name} />}
              {order.customer_contact && <Info label="Contact" value={order.customer_contact} />}
              {order.special_instructions && <Info label="Instructions" value={order.special_instructions} full />}
            </div>
            {order.document_deleted && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                <FileWarning className="h-4 w-4" />
                This document is no longer available because it was automatically deleted for privacy.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="font-bold text-ink">Payment</h2>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm text-muted">Amount</p>
                <p className="text-xl font-extrabold text-ink">{formatCurrency(order.total_price)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">Status</p>
                <p className={`font-bold ${order.payment_status === "PAID" ? "text-success" : "text-amber-600"}`}>
                  {order.payment_status === "PAID" ? "Paid (manual)" : "Pay at shop"}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">
              Phase 1 has no online payment. Manual collections are labelled and are not gateway-verified.
            </p>
            {order.payment_status !== "PAID" && (
              <Button className="mt-3" variant="success" leftIcon={<IndianRupee className="h-4 w-4" />} onClick={() => setPayOpen(true)}>
                Mark payment received at shop
              </Button>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="font-bold text-ink">Actions</h2>
            <p className="mt-1 text-xs text-muted">
              All status changes are manual and recorded in the audit log. No printer is triggered.
            </p>
            <div className="mt-4 space-y-2">
              {actions.map((a) => (
                <Button
                  key={a.to}
                  variant={a.variant}
                  className="w-full"
                  loading={statusMutation.isPending}
                  leftIcon={<PrinterIcon className="h-4 w-4" />}
                  onClick={() => statusMutation.mutate({ to: a.to })}
                >
                  {a.label}
                </Button>
              ))}
              {terminal && (
                <p className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> This order is closed.
                </p>
              )}
              {!terminal && (
                <Button
                  variant="ghost"
                  className="w-full text-red-600 hover:bg-red-50"
                  leftIcon={<X className="h-4 w-4" />}
                  loading={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                >
                  Cancel order
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-ink">Timeline</h2>
            <ul className="mt-3 space-y-3">
              {(order.events ?? []).map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-semibold text-ink">{titleCase(e.event_type)}</p>
                    <p className="text-xs text-muted">
                      {e.old_status ? `${e.old_status} → ${e.new_status}` : e.new_status ?? ""} · {e.actor_role ?? "system"}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(e.created_at)}</p>
                  </div>
                </li>
              ))}
              {(!order.events || order.events.length === 0) && <p className="text-sm text-muted">No events yet.</p>}
            </ul>
          </Card>
        </div>
      </div>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Document preview">
        {previewError ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{previewError}</p>
        ) : previewUrl ? (
          <img src={previewUrl} alt="Preview" className="mx-auto max-h-[60vh] rounded-lg border border-line" />
        ) : (
          <Skeleton className="h-72" />
        )}
        <p className="mt-3 text-xs text-muted">Preview is rendered securely and served via a short-lived link.</p>
      </Modal>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record manual payment"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button variant="success" loading={payMutation.isPending} onClick={() => payMutation.mutate()}>
              Confirm payment received
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Record that {formatCurrency(order.total_price)} was collected at the shop for {order.order_number}. This is a
          manual entry and is not verified by a payment gateway.
        </p>
        <textarea
          className="input mt-3 min-h-[80px]"
          placeholder="Optional note (e.g. cash / UPI)"
          value={payNote}
          onChange={(e) => setPayNote(e.target.value)}
        />
      </Modal>
    </div>
  );
}

function Info({ label, value, full }: { label: string; value: ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium text-ink">{value}</p>
    </div>
  );
}
