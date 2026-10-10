import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Printer } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/api";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      toast.success("Welcome back", `Signed in as ${user.full_name}`);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || (user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"), { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to sign in.";
      setError(message);
      toast.error("Sign in failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white">
            <Printer className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-ink">Shop &amp; Admin Login</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage your shop or the platform.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@shop.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          New shop?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register your shop
          </Link>
        </p>
        <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-muted">
          <p className="font-semibold text-slate-600">Demo accounts (seeded):</p>
          <p>Shop: demo@smartxerox.app / Demo@12345</p>
          <p>Admin: admin@smartxerox.app / Admin@12345</p>
        </div>
      </Card>
    </div>
  );
}
