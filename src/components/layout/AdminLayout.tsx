import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/shops", label: "Shops" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/settings", label: "Platform Settings" },
  { to: "/admin/logs", label: "Activity & Errors" },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-surface lg:flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-line bg-secondary p-4 text-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <span className="block text-lg font-extrabold leading-none">Smart Xerox</span>
              <span className="text-xs text-slate-400">Super Admin</span>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "block rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                  isActive ? "bg-primary text-white" : "text-slate-300 hover:bg-white/10"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute inset-x-4 bottom-4">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="truncate text-sm font-semibold">{user?.full_name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
            <button
              onClick={doLogout}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-red-300 hover:text-red-200"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-ink">Admin Console</span>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
