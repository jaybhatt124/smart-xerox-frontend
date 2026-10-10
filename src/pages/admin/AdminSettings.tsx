import { useEffect, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Save, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input, Label, PageLoader } from "@/components/ui";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/utils";

export default function AdminSettings() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["admin-settings"], queryFn: api.adminSettings });
  const { data: announcements } = useQuery({ queryKey: ["admin-announcements"], queryFn: api.adminAnnouncements });

  const [form, setForm] = useState({
    platform_name: "Smart Xerox",
    support_email: "",
    max_file_size_mb: 25,
    allowed_file_types: "pdf",
    default_order_expiry_minutes: 540,
    default_document_retention_minutes: 4320,
    shop_registration_open: true,
    maintenance_mode: false,
  });
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");

  useEffect(() => {
    if (data) {
      setForm({
        platform_name: data.platform_name ?? "Smart Xerox",
        support_email: data.support_email ?? "",
        max_file_size_mb: Number(data.max_file_size_mb ?? 25),
        allowed_file_types: data.allowed_file_types ?? "pdf",
        default_order_expiry_minutes: Number(data.default_order_expiry_minutes ?? 540),
        default_document_retention_minutes: Number(data.default_document_retention_minutes ?? 4320),
        shop_registration_open: !!data.shop_registration_open,
        maintenance_mode: !!data.maintenance_mode,
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.updateAdminSettings(form),
    onSuccess: () => {
      toast.success("Platform settings saved");
      void qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (e: Error) => toast.error("Could not save", e.message),
  });

  const createAnn = useMutation({
    mutationFn: () => api.createAnnouncement({ title: annTitle, body: annBody || undefined, is_active: true }),
    onSuccess: () => {
      toast.success("Announcement published");
      setAnnTitle("");
      setAnnBody("");
      void qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
    onError: (e: Error) => toast.error("Could not publish", e.message),
  });

  const delAnn = useMutation({
    mutationFn: (id: string) => api.deleteAnnouncement(id),
    onSuccess: () => {
      toast.success("Announcement deleted");
      void qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    },
  });

  if (isLoading) return <PageLoader />;

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const val = target.type === "checkbox" ? target.checked : Number(target.value) || target.value;
    setForm((f) => ({ ...f, [k]: val as never }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Platform Settings</h1>
        <p className="text-sm text-muted">Global defaults applied to every shop.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-bold text-ink">General</h2>
          <div className="mt-4 space-y-4">
            <div><Label>Platform name</Label><Input value={form.platform_name} onChange={set("platform_name")} /></div>
            <div><Label>Support email</Label><Input value={form.support_email} onChange={set("support_email")} placeholder="support@smartxerox.app" /></div>
            <div><Label>Allowed file types</Label><Input value={form.allowed_file_types} onChange={set("allowed_file_types")} /></div>
            <div>
              <Label>Max file size (MB)</Label>
              <Input type="number" min={1} max={100} value={form.max_file_size_mb} onChange={set("max_file_size_mb")} />
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <h2 className="font-bold text-ink">Retention &amp; expiry</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label>Default order expiry (minutes)</Label>
                <Input type="number" min={5} value={form.default_order_expiry_minutes} onChange={set("default_order_expiry_minutes")} />
              </div>
              <div>
                <Label>Default document retention (minutes)</Label>
                <Input type="number" min={1} value={form.default_document_retention_minutes} onChange={set("default_document_retention_minutes")} />
                <p className="mt-1 text-xs text-muted">Defaults: 9 hours / 72 hours as per the privacy policy.</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-ink">Control flags</h2>
            <div className="mt-4 space-y-4">
              <ToggleRow label="Open shop registration" hint="Allow new shops to register" checked={form.shop_registration_open} onChange={(v) => setForm((f) => ({ ...f, shop_registration_open: v }))} />
              <ToggleRow label="Maintenance mode" hint="Block checkouts across the platform" checked={form.maintenance_mode} onChange={(v) => setForm((f) => ({ ...f, maintenance_mode: v }))} />
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">Announcements</h2>
          <Button loading={save.isPending} leftIcon={<Save className="h-4 w-4" />} onClick={() => save.mutate()}>Save settings</Button>
        </div>
        <p className="mt-1 text-sm text-muted">Published announcements appear to customers.</p>

        <div className="mt-4 rounded-2xl border border-line bg-slate-50 p-4">
          <p className="text-sm font-semibold text-ink">New announcement</p>
          <div className="mt-3 space-y-3">
            <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Title" />
            <textarea className="input min-h-[80px]" value={annBody} onChange={(e) => setAnnBody(e.target.value)} placeholder="Message (optional)" />
            <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} disabled={!annTitle.trim()} loading={createAnn.isPending} onClick={() => createAnn.mutate()}>
              Publish
            </Button>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {(announcements ?? []).map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
              <Megaphone className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{a.title}</p>
                {a.body && <p className="truncate text-sm text-slate-600">{a.body}</p>}
                <p className="text-xs text-slate-400">{formatDate(a.created_at)}</p>
              </div>
              <Badge tone={a.is_active ? "green" : "slate"}>{a.is_active ? "Active" : "Inactive"}</Badge>
              <button onClick={() => delAnn.mutate(a.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
      <div>
        <p className="font-semibold text-ink">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <button onClick={() => onChange(!checked)} className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}