import { Link, NavLink, Outlet } from "react-router-dom";
import { Printer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function PublicNav() {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const links = [
    { to: "/", label: "Home", end: true },
    { to: "/features", label: "Features" },
    { to: "/how-it-works", label: "How it works" },
    { to: "/pricing", label: "Pricing" },
    { to: "/contact", label: "Contact" },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
            <Printer className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold text-ink">Smart Xerox</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive ? "text-primary" : "text-slate-600 hover:text-ink"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              to={isAdmin ? "/admin" : "/dashboard"}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              {user?.role === "SUPER_ADMIN" ? "Admin Console" : "Dashboard"}
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:block">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Register Shop
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
              <Printer className="h-4 w-4" />
            </span>
            <span className="font-extrabold text-ink">Smart Xerox</span>
          </div>
          <p className="mt-3 text-sm text-muted">
            QR-based cloud printing management for Xerox and print shops. Scan, upload, submit — pay
            at the shop.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link to="/features" className="hover:text-primary">Features</Link></li>
            <li><Link to="/how-it-works" className="hover:text-primary">How it works</Link></li>
            <li><Link to="/pricing" className="hover:text-primary">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Shops</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link to="/register" className="hover:text-primary">Register your shop</Link></li>
            <li><Link to="/login" className="hover:text-primary">Shop login</Link></li>
            <li><span className="text-slate-400">Online payments — Coming soon</span></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><span className="text-slate-400">Automatic printing — Coming soon</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5">
        <p className="container-page text-xs text-slate-400">
          © {new Date().getFullYear()} Smart Xerox. Phase 1 — manual printing & pay-at-shop. Demo and
          simulated operations are clearly labelled.
        </p>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
