import { useEffect, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Upload } from "lucide-react";
import { Button, Card, Input, Label, PageLoader } from "@/components/ui";
import { api, fileUrl } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function ShopProfile() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["my-shop"], queryFn: api.myShop });
  const [form, setForm] = useState({
    shop_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    business_hours: "",
    description: "",
  });
  const [logo, setLogo] = useState<File | null>(null);

  useEffect(() => {
    if (data) {
      setForm({
        shop_name: data.shop_name ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        postal_code: data.postal_code ?? "",
        business_hours: data.business_hours ?? "",
        description: data.description ?? "",
      });
    }
  }, [data]);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: async () => {
      await api.updateShop(form);
      if (logo) await api.uploadLogo(logo);
    },
    onSuccess: () => {
      toast.success("Shop profile updated");
      setLogo(null);
      void qc.invalidateQueries({ queryKey: ["my-shop"] });
      void qc.invalidateQueries({ queryKey: ["public-shop"] });
    },
    onError: (e: Error) => toast.error("Could not save", e.message),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Shop Profile</h1>
          <p className="text-sm text-muted">This information is shown to your customers.</p>
        </div>
        <Button loading={save.isPending} leftIcon={<Save className="h-4 w-4" />} onClick={() => save.mutate()}>
          Save changes
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <Label>Shop logo</Label>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-slate-50 p-5">
            {logo ? (
              <img src={URL.createObjectURL(logo)} alt="logo preview" className="h-24 w-24 rounded-2xl object-cover" />
            ) : data?.logo_url ? (
              <img src={fileUrl(data.logo_url) ?? ""} alt="logo" className="h-24 w-24 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold text-primary">
                {(form.shop_name || "S").charAt(0).toUpperCase()}
              </div>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm ring-1 ring-line">
              <Upload className="h-4 w-4" /> Choose logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="text-xs text-muted">PNG or JPG, up to 2 MB.</p>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <p className="text-muted">Public shop ID</p>
            <p className="font-mono font-semibold text-ink">{data?.public_shop_id}</p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-bold text-ink">Business details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><Label>Shop name</Label><Input value={form.shop_name} onChange={set("shop_name")} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} /></div>
            <div className="sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={set("address")} /></div>
            <div><Label>City</Label><Input value={form.city} onChange={set("city")} /></div>
            <div><Label>State</Label><Input value={form.state} onChange={set("state")} /></div>
            <div><Label>Postal code</Label><Input value={form.postal_code} onChange={set("postal_code")} /></div>
            <div><Label>Business hours</Label><Input value={form.business_hours} onChange={set("business_hours")} placeholder="e.g. Mon–Sat, 9am–8pm" /></div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <textarea className="input min-h-[96px]" value={form.description} onChange={set("description")} placeholder="Tell customers about your shop…" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
