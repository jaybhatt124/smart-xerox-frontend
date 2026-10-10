import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/api";

const initial = {
  full_name: "",
  email: "",
  password: "",
  shop_name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postal_code: "",
  description: "",
};

export default function Register() {
  const { registerShop } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof initial) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registerShop({ ...form });
      toast.success("Shop registered", "Your shop is pending approval by the platform admin.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to register.";
      setError(message);
      toast.error("Registration failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page max-w-2xl py-12">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-ink">Register your shop</h1>
        <p className="mt-2 text-muted">
          Create your account and shop profile. After admin approval you can receive print orders.
        </p>
      </div>
      <Card>
        <form onSubmit={onSubmit} className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Owner account</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" required value={form.full_name} onChange={set("full_name")} placeholder="Ravi Kumar" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={form.email} onChange={set("email")} placeholder="owner@shop.com" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required minLength={8} value={form.password} onChange={set("password")} placeholder="At least 8 characters" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Shop details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="shop_name">Shop name</Label>
                <Input id="shop_name" required value={form.shop_name} onChange={set("shop_name")} placeholder="Sri Ganesh Xerox" />
              </div>
              <div>
                <Label htmlFor="phone">Mobile number</Label>
                <Input id="phone" required value={form.phone} onChange={set("phone")} placeholder="9876543210" />
              </div>
              <div>
                <Label htmlFor="postal_code">Postal code</Label>
                <Input id="postal_code" required value={form.postal_code} onChange={set("postal_code")} placeholder="560001" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Shop address</Label>
                <Input id="address" required value={form.address} onChange={set("address")} placeholder="12 MG Road" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" required value={form.city} onChange={set("city")} placeholder="Bengaluru" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" required value={form.state} onChange={set("state")} placeholder="Karnataka" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Shop description (optional)</Label>
                <Textarea id="description" value={form.description} onChange={set("description")} placeholder="We offer fast printing, lamination and binding." />
              </div>
            </div>
          </section>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Already registered?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
            </p>
            <Button type="submit" loading={loading}>Create shop account</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
