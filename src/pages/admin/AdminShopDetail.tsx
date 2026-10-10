import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, PauseCircle, RefreshCw, XCircle } from "lucide-react";
import { Badge, Button, Card, PageLoader, SectionTitle, Textarea } from "@/components/ui";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";

type Action = "APPROVE" | "REJECT" | "SUSPEND" | "REACTIVATE";

const ACTION_META: Record<Action, { label: string; tone: "success" | "danger" | "danger" | "primary" }> = {
  APPROVE: { label: "Approve shop", tone: "success" },
  REJECT: { label: "Reject", tone: "danger" },
  SUSPEND: { label: "Suspend", tone: "danger" },
  REACTIVATE: { label: "Reactivate", tone: "primary" },
};

export default function AdminShopDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-shop", id],
    queryFn: () => api.adminShop(id),
    refetchInterval: 20000,
  });

  const act = useMutation({
    mutationFn: () => api.adminShopAction(id, action as string, reason || undefined),
    onSuccess: (s) => {
      toast.success("Shop updated", `${s.shop_name} is now ${s.approval_status.replace("_", " ")}.`);
      setAction(null);
      setReason("");
      void qc.invalidateQueries({ queryKey: ["admin-shop", id] });
      void qc.invalidateQueries({ queryKey: ["admin-shops"] });
      void qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error("Action failed", e.message),
  });

  if (isLoading) return <PageLoader />;
  if (!data) return <Card>Shop not found.</Card>;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to shops
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-ink">{data.shop_name}</h1>
            <Badge tone={data.approval_status === "APPROVED" ? "green" : data.approval_status === "PENDING_APPROVAL" ? "amber" : "red"}>
              {data.approval_status.replace("_", " ")}
            </Badge>
          </div>
          <p className="font-mono text-sm text-slate-400">{data.public_shop_id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.approval_status === "PENDING_APPROVAL" || data.approval_status === "REJECTED" || data.approval_status === "SUSPENDED" ? (
            <Button leftIcon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setAction("APPROVE")}>Approve</Button>
          ) : null}
          {data.approval_status !== "SUSPENDED" && data.approval_status !== "REJECTED" && (
            <>
              <Button variant="outline" leftIcon={<PauseCircle className="h-4 w-4" />} onClick={() => setAction("SUSPEND")}>Suspend</Button>
              <Button variant="ghost" className="text-red-600 hover:bg-red-50" leftIcon={<XCircle className="h-4 w-4" />} onClick={() => setAction("REJECT")}>Reject</Button>
            </>
          )}
          {data.approval_status === "SUSPENDED" && (
            <Button variant="accent" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => setAction("REACTIVATE")}>Reactivate</Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <SectionTitle title="Business details" />
          <div className="space-y-2 text-sm">
            <Row label="Owner" value={`${data.owner_name ?? "—"} (${data.owner_email ?? "—"})`} />
            <Row label="Phone" value={data.phone ?? "—"} />
            <Row label="Address" value={data.address ?? "—"} />
            <Row label="City" value={data.city ?? "—"} />
            <Row label="Postal code" value={data.postal_code ?? "—"} />
            <Row label="Joined" value={formatDate(data.created_at)} />
            <Row label="Total orders" value={data.total_orders ?? 0} />
            <Row label="Accepting orders" value={data.accepting_orders ? "Yes" : "No"} />
          </div>
          {data.description && (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{data.description}</p>
          )}
          {data.rejection_reason && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">Reason: {data.rejection_reason}</p>
          )}
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <SectionTitle title="Moderation action" />
            <p className="text-sm text-muted">
              Approving lets the shop go live. Rejecting or suspending blocks customers from ordering and leaves a
              rejection reason. All changes are recorded in the audit log.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(Object.keys(ACTION_META) as Action[])
                .filter((a) => !(a === "APPROVE" && data.approval_status === "APPROVED"))
                .map((a) => (
                  <Button
                    key={a}
                    variant={a === "APPROVE" ? "success" : a === "REACTIVATE" ? "accent" : "outline"}
                    className={a === "REJECT" || a === "SUSPEND" ? "text-red-600 hover:bg-red-50" : ""}
                    onClick={() => setAction(a)}
                  >
                    {ACTION_META[a].label}
                  </Button>
                ))}
            </div>
          </Card>
        </div>
      </div>

      {(action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-soft">
            <h3 className="text-lg font-bold text-ink">{ACTION_META[action].label}</h3>
            <p className="mt-1 text-sm text-muted mb-3">
              {action === "REJECT" || action === "SUSPEND"
                ? "Optionally provide a reason for the shop owner. It will be shown to them."
                : "Confirm this action for the shop."}
            </p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAction(null)}>Cancel</Button>
              <Button
                variant={action === "APPROVE" ? "success" : action === "REACTIVATE" ? "accent" : "danger"}
                loading={act.isPending}
                onClick={() => act.mutate()}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line pb-2">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  );
}