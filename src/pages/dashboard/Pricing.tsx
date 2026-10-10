import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button, Card, Input, Label, PageLoader, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import type { PricingRule } from "@/types";

const PAPER_LABEL: Record<string, string> = { A4: "A4", A3: "A3", LETTER: "Letter" };

export default function Pricing() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["pricing"], queryFn: api.pricing });
  const [rules, setRules] = useState<PricingRule[]>([]);

  useEffect(() => {
    if (data) setRules(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      api.updatePricing(
        rules.map((r) => ({ paper_size: r.paper_size, color_mode: r.color_mode, price_per_page: r.price_per_page, is_enabled: r.is_enabled }))
      ),
    onSuccess: (updated) => {
      setRules(updated);
      toast.success("Pricing saved", "New rates apply to future orders only.");
      void qc.invalidateQueries({ queryKey: ["pricing"] });
    },
    onError: (e: Error) => toast.error("Could not save pricing", e.message),
  });

  const update = (id: string, patch: Partial<PricingRule>) =>
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Pricing Management</h1>
          <p className="text-sm text-muted">Set your per-page rates. Changes never affect existing orders.</p>
        </div>
        <Button loading={save.isPending} leftIcon={<Save className="h-4 w-4" />} onClick={() => save.mutate()}>
          Save pricing
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Paper</th>
                <th className="px-5 py-3 font-semibold">Colour mode</th>
                <th className="px-5 py-3 font-semibold">Price per page (₹)</th>
                <th className="px-5 py-3 font-semibold">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rules.map((r) => (
                <tr key={r.id} className="bg-white">
                  <td className="px-5 py-3 font-semibold text-ink">{PAPER_LABEL[r.paper_size]}</td>
                  <td className="px-5 py-3 text-slate-600">{r.color_mode === "BW" ? "Black & White" : "Colour"}</td>
                  <td className="px-5 py-3">
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      value={r.price_per_page}
                      onChange={(e) => update(r.id, { price_per_page: Number(e.target.value) })}
                      className="w-32"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={r.is_enabled}
                        onChange={(e) => update(r.id, { is_enabled: e.target.checked })}
                        className="h-4 w-4 rounded accent-[#2563EB]"
                      />
                      <span className="text-slate-600">{r.is_enabled ? "Enabled" : "Disabled"}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <Label>Pricing formula</Label>
        <p className="text-sm text-muted">
          Total = (selected pages × copies × price per page) + handling charge, subject to a minimum order
          amount. Duplex pricing uses the same per-page rate unless you configure otherwise. Estimated paper
          sheets are shown separately at checkout.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          Minimum order amount, handling charge, maximum copies and paper availability are configured in{" "}
          <a href="/dashboard/settings" className="font-semibold text-primary hover:underline">Settings</a>.
        </p>
      </Card>

      {rules.length === 0 && <Skeleton className="h-40" />}
    </div>
  );
}
