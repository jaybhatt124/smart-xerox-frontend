import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Printer, RefreshCw, Save, Volume2, VolumeX } from "lucide-react";
import { Button, Card, Input, Label, PageLoader } from "@/components/ui";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function Settings() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: api.mySettings });
  const devices = useQuery({ queryKey: ["shop-devices"], queryFn: api.shopDevices });
  const [form, setForm] = useState({
    default_paper_size: "A4",
    color_enabled: true,
    duplex_enabled: true,
    a3_enabled: false,
    letter_enabled: false,
    max_file_size_mb: 25,
    max_copies: 5,
    min_order_amount: 0,
    handling_charge: 0,
    order_expiry_minutes: 540,
    document_retention_minutes: 72 * 60,
    auto_print_enabled: false,
    require_payment_before_print: false,
  });
  const [sound, setSound] = useState(localStorage.getItem("sx_sound") !== "false");
  const [pairing, setPairing] = useState<{ pairing_code: string; expires_at: string } | null>(null);

  useEffect(() => {
    if (data) {
      setForm({
        default_paper_size: data.default_paper_size ?? "A4",
        color_enabled: !!data.color_enabled,
        duplex_enabled: !!data.duplex_enabled,
        a3_enabled: !!data.a3_enabled,
        letter_enabled: !!data.letter_enabled,
        max_file_size_mb: Number(data.max_file_size_mb ?? 25),
        max_copies: Number(data.max_copies ?? 5),
        min_order_amount: Number(data.min_order_amount ?? 0),
        handling_charge: Number(data.handling_charge ?? 0),
        order_expiry_minutes: Number(data.order_expiry_minutes ?? 540),
        document_retention_minutes: Number(data.document_retention_minutes ?? 4320),
        auto_print_enabled: !!data.auto_print_enabled,
        require_payment_before_print: !!data.require_payment_before_print,
      });
      setSound(!!data.notification_sound);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.updateSettings(form),
    onSuccess: () => {
      toast.success("Settings saved");
      void qc.invalidateQueries({ queryKey: ["settings"] });
      void qc.invalidateQueries({ queryKey: ["public-shop"] });
    },
    onError: (e: Error) => toast.error("Could not save settings", e.message),
  });

  const generateCode = useMutation({
    mutationFn: () => api.pairingCode(),
    onSuccess: (res) => {
      setPairing(res);
      toast.success("Pairing code generated — valid for 15 minutes");
    },
    onError: (e: Error) => toast.error("Could not generate pairing code", e.message),
  });

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    localStorage.setItem("sx_sound", String(next));
  };

  const copyCode = async () => {
    if (!pairing) return;
    try {
      await navigator.clipboard.writeText(pairing.pairing_code);
      toast.success("Pairing code copied");
    } catch {
      toast.error("Could not access clipboard");
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Shop Settings</h1>
          <p className="text-sm text-muted">Defaults applied to every customer checkout.</p>
        </div>
        <Button loading={save.isPending} leftIcon={<Save className="h-4 w-4" />} onClick={() => save.mutate()}>
          Save settings
        </Button>
      </div>

      <Card>
        <h2 className="font-bold text-ink">Printing options</h2>
        <div className="mt-4 space-y-5">
          <div>
            <Label>Default paper size</Label>
            <div className="flex flex-wrap gap-2">
              {(["A4", "A3", "LETTER"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, default_paper_size: s }))}
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    form.default_paper_size === s ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ToggleRow
              label="Colour printing"
              hint="Offer colour prints (priced separately)"
              checked={form.color_enabled}
              onChange={(v) => setForm((f) => ({ ...f, color_enabled: v }))}
            />
            <ToggleRow
              label="Duplex"
              hint="Double-sided printing"
              checked={form.duplex_enabled}
              onChange={(v) => setForm((f) => ({ ...f, duplex_enabled: v }))}
            />
            <ToggleRow
              label="A3 paper"
              hint="Offer the A3 size"
              checked={form.a3_enabled}
              onChange={(v) => setForm((f) => ({ ...f, a3_enabled: v }))}
            />
            <ToggleRow
              label="Letter paper"
              hint="Offer the US Letter size"
              checked={form.letter_enabled}
              onChange={(v) => setForm((f) => ({ ...f, letter_enabled: v }))}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 font-bold text-ink">
          <Printer className="h-4 w-4 text-primary" /> Automatic printing
        </h2>
        <p className="mt-1 text-sm text-muted">
          Orders print by themselves on this PC&rsquo;s printer. Install the Windows agent and pair it once with a pairing code.
        </p>
        <div className="mt-4 space-y-3">
          <ToggleRow
            label="Enable automatic printing"
            hint="When ON, new orders are claimed and printed automatically."
            checked={form.auto_print_enabled}
            onChange={(v) => setForm((f) => ({ ...f, auto_print_enabled: v }))}
          />
          {form.auto_print_enabled && (
            <ToggleRow
              label="Require payment before print"
              hint="ON = only paid-at-shop orders print automatically; OFF = prints immediately."
              checked={form.require_payment_before_print}
              onChange={(v) => setForm((f) => ({ ...f, require_payment_before_print: v }))}
            />
          )}

          <div className="flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 px-4 py-4">
            <div className="min-w-[220px] flex-1">
              <Label>Pairing code</Label>
              {pairing ? (
                <div className="mt-1 flex items-center gap-2 rounded-lg border-2 border-dashed border-primary/50 bg-white px-3 py-2">
                  <span className="font-mono text-lg font-bold tracking-[0.2em] text-primary">{pairing.pairing_code}</span>
                  <span className="text-xs text-muted">expires {new Date(pairing.expires_at).toLocaleTimeString()}</span>
                </div>
              ) : (
                <p className="text-xs text-muted">Generate a one-time code, then run <code className="rounded bg-slate-200 px-1">printer_agent.py pair</code> on the shop PC.</p>
              )}
            </div>
            <Button
              variant={pairing ? "outline" : "primary"}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              loading={generateCode.isPending}
              onClick={() => generateCode.mutate()}
            >
              {pairing ? "New code" : "Generate code"}
            </Button>
            {pairing && (
              <Button variant="outline" leftIcon={<Copy className="h-4 w-4" />} onClick={copyCode}>
                Copy
              </Button>
            )}
          </div>

          <div>
            <Label>Paired devices</Label>
            {devices.isLoading ? (
              <p className="mt-1 text-sm text-muted">Loading devices&hellip;</p>
            ) : devices.data && devices.data.length > 0 ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {devices.data.map((d) => (
                  <div key={d.device_id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-ink">{d.device_name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${d.pairing_status === "PAIRED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {d.pairing_status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {d.printer_name || (d.printers[0]?.name ?? "No printer")}
                      {d.last_seen_at ? ` · seen ${new Date(d.last_seen_at).toLocaleString()}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-muted">
                No agent paired yet. Keep <code className="rounded bg-slate-200 px-1">printer_agent.py run</code> open on this PC.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-ink">Order, pricing &amp; limits</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Max file size (MB)</Label>
            <Input type="number" min={1} max={100} value={form.max_file_size_mb} onChange={(e) => setForm((f) => ({ ...f, max_file_size_mb: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>Max copies per order</Label>
            <Input type="number" min={1} max={1000} value={form.max_copies} onChange={(e) => setForm((f) => ({ ...f, max_copies: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>Minimum order amount (₹)</Label>
            <Input type="number" min={0} step="0.5" value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>Handling charge (₹)</Label>
            <Input type="number" min={0} step="0.5" value={form.handling_charge} onChange={(e) => setForm((f) => ({ ...f, handling_charge: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>Order expires after (minutes)</Label>
            <Input type="number" min={5} value={form.order_expiry_minutes} onChange={(e) => setForm((f) => ({ ...f, order_expiry_minutes: Number(e.target.value) }))} />
            <p className="mt-1 text-xs text-muted">Unpaid orders auto-expire after this.</p>
          </div>
          <div>
            <Label>Document retention (minutes)</Label>
            <Input type="number" min={1} value={form.document_retention_minutes} onChange={(e) => setForm((f) => ({ ...f, document_retention_minutes: Number(e.target.value) }))} />
            <p className="mt-1 text-xs text-muted">Shop copies are auto-deleted after this.</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-ink">Notifications</h2>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3">
            {sound ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-slate-400" />}
            <div>
              <p className="font-semibold text-ink">New-order sound</p>
              <p className="text-xs text-muted">Play a short beep when a new order arrives.</p>
            </div>
          </div>
          <button onClick={toggleSound} className={`relative h-6 w-11 rounded-full transition ${sound ? "bg-primary" : "bg-slate-300"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${sound ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
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