import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, tokenStore } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  shopId: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerShop: (body: Record<string, unknown>) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null);
      setShopId(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me.user);
      setShopId(me.shop_id);
    } catch {
      tokenStore.clear();
      setUser(null);
      setShopId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    tokenStore.set(res.access_token);
    setUser(res.user);
    setShopId(res.shop_id);
    return res.user;
  }, []);

  const registerShop = useCallback(async (body: Record<string, unknown>) => {
    const res = await api.registerShop(body);
    tokenStore.set(res.access_token);
    setUser(res.user);
    setShopId(res.shop_id);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    tokenStore.clear();
    setUser(null);
    setShopId(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      shopId,
      loading,
      isAuthenticated: !!user,
      isOwner: user?.role === "SHOP_OWNER",
      isAdmin: user?.role === "SUPER_ADMIN",
      login,
      registerShop,
      logout,
      refresh: load,
    }),
    [user, shopId, loading, login, registerShop, logout, load]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
