import type {
  ActivityLog,
  Announcement,
  DailyStats,
  DocumentMeta,
  Notification,
  Order,
  OrderCreated,
  OrderList,
  Overview,
  PlatformSettings,
  PlatformStats,
  PriceBreakdown,
  PricingRule,
  PublicShop,
  QRInfo,
  Shop,
  ShopDeviceSummary,
  ShopSettings,
  SystemStatus,
  TokenResponse,
  TrackOrder,
  User,
} from "@/types";

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "sx_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function extractDetail(data: unknown): string {
  if (!data) return "Something went wrong.";
  if (typeof data === "string") return data;
  const d = data as Record<string, unknown>;
  if (typeof d.detail === "string") return d.detail;
  if (Array.isArray(d.detail)) {
    const first = d.detail[0] as Record<string, unknown>;
    if (first && typeof first.msg === "string") return first.msg;
  }
  return "Something went wrong.";
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
  auth?: boolean;
  raw?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.auth !== false) {
    const t = tokenStore.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body,
  });

  if (opts.raw) {
    if (!res.ok) throw new ApiError(await res.text(), res.status);
    return res as unknown as T;
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = extractDetail(data);
    if (res.status === 401 && tokenStore.get()) {
      tokenStore.clear();
    }
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export function fileUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/api/files/logo?key=")) {
    const key = path.split("key=")[1];
    return `${API_BASE}/api/files/logo?key=${encodeURIComponent(key)}`;
  }
  if (path.startsWith("/api/files")) return `${API_BASE}${path}`;
  return `${API_BASE}${path}`;
}

// ---------------------------------------------------------------- endpoints
export const api = {
  // Auth
  registerShop: (body: Record<string, unknown>) =>
    request<TokenResponse>("/api/auth/register-shop", { method: "POST", body, auth: false }),
  login: (email: string, password: string) =>
    request<TokenResponse>("/api/auth/login", { method: "POST", body: { email, password }, auth: false }),
  me: () => request<TokenResponse>("/api/auth/me"),
  logout: () => request<{ detail: string }>("/api/auth/logout", { method: "POST" }),

  // Shop
  myShop: () => request<Shop>("/api/shops/me"),
  updateShop: (body: Partial<Shop>) => request<Shop>("/api/shops/me", { method: "PUT", body }),
  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<Shop>("/api/shops/me/logo", { method: "POST", formData: fd });
  },
  setAccepting: (accepting: boolean) =>
    request<{ accepting_orders: boolean }>(`/api/shops/me/accepting?accepting=${accepting}`, { method: "POST" }),
  mySettings: () => request<ShopSettings>("/api/shops/me/settings"),
  updateSettings: (body: Partial<ShopSettings>) =>
    request<ShopSettings>("/api/shops/me/settings", { method: "PUT", body }),
  pairingCode: () => request<{ pairing_code: string; expires_at: string }>("/api/shops/me/pairing-code", { method: "POST" }),
  shopDevices: () => request<ShopDeviceSummary[]>("/api/shops/me/devices"),
  publicShop: (publicId: string) => request<PublicShop>(`/api/shops/public/${publicId}`, { auth: false }),

  // Pricing
  pricing: () => request<PricingRule[]>("/api/shops/me/pricing"),
  updatePricing: (rules: Partial<PricingRule>[]) =>
    request<PricingRule[]>("/api/shops/me/pricing", { method: "PUT", body: { rules } }),
  calculatePrice: (publicId: string, body: Record<string, unknown>) =>
    request<PriceBreakdown>(`/api/shops/public/${publicId}/calculate`, { method: "POST", body, auth: false }),

  // Documents
  uploadDocument: (shopPublicId: string, file: File) => {
    const fd = new FormData();
    fd.append("shop_public_id", shopPublicId);
    fd.append("file", file);
    return request<DocumentMeta>("/api/documents/upload", { method: "POST", formData: fd, auth: false });
  },

  // Orders (public)
  submitOrder: (body: Record<string, unknown>) =>
    request<OrderCreated>("/api/orders", { method: "POST", body, auth: false }),
  trackOrder: (token: string) => request<TrackOrder>(`/api/orders/track/${token}`, { auth: false }),

  // Orders (owner)
  orders: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== null) qs.set(k, String(v));
    });
    return request<OrderList>(`/api/shops/me/orders?${qs.toString()}`);
  },
  order: (id: string) => request<Order>(`/api/orders/${id}`),
  orderDocumentUrl: (id: string) =>
    request<{ preview_url: string; download_url: string; expires_in_seconds: number }>(
      `/api/orders/${id}/document`
    ),
  updateOrderStatus: (id: string, status: string, note?: string) =>
    request<Order>(`/api/orders/${id}/status`, { method: "PATCH", body: { status, note } }),
  recordPayment: (id: string, amount?: number, note?: string) =>
    request<Order>(`/api/orders/${id}/payment`, { method: "POST", body: { amount, note } }),
  cancelOrder: (id: string, note?: string) =>
    request<Order>(`/api/orders/${id}/cancel${note ? `?note=${encodeURIComponent(note)}` : ""}`, {
      method: "POST",
    }),

  // Analytics
  overview: () => request<Overview>("/api/shops/me/overview"),
  dailyStats: (days = 30) => request<DailyStats>(`/api/shops/me/analytics/daily?days=${days}`),

  // QR
  qrInfo: () => request<QRInfo>("/api/shops/me/qr"),
  regenerateQr: () => request<QRInfo>("/api/shops/me/qr/regenerate", { method: "POST" }),
  qrBlob: (format: "png" | "svg" | "poster") =>
    request<Response>(`/api/shops/me/qr${format === "poster" ? "/poster" : `.${format}`}`, { raw: true }),

  // Notifications
  notifications: (unreadOnly = false) =>
    request<Notification[]>(`/api/shops/me/notifications?unread_only=${unreadOnly}`),
  unreadCount: () => request<{ unread: number }>("/api/shops/me/notifications/unread-count"),
  markRead: (id: string) =>
    request<{ detail: string }>(`/api/shops/me/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () =>
    request<{ detail: string }>("/api/shops/me/notifications/read-all", { method: "POST" }),

  // Admin
  adminStats: () => request<PlatformStats>("/api/admin/stats"),
  adminShops: (params: Record<string, string | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
    return request<Shop[]>(`/api/admin/shops?${qs.toString()}`);
  },
  adminShop: (id: string) => request<Shop>(`/api/admin/shops/${id}`),
  adminShopAction: (id: string, action: string, reason?: string) =>
    request<Shop>(`/api/admin/shops/${id}/action`, { method: "POST", body: { action, reason } }),
  adminOrders: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    return request<OrderList>(`/api/admin/orders?${qs.toString()}`);
  },
  adminUsers: (role?: string) =>
    request<User[]>(`/api/admin/users${role ? `?role=${role}` : ""}`),
  adminSettings: () => request<PlatformSettings>("/api/admin/settings"),
  updateAdminSettings: (body: Partial<PlatformSettings>) =>
    request<PlatformSettings>("/api/admin/settings", { method: "PUT", body }),
  adminAnnouncements: () => request<Announcement[]>("/api/admin/announcements"),
  createAnnouncement: (body: { title: string; body?: string; is_active?: boolean }) =>
    request<Announcement>("/api/admin/announcements", { method: "POST", body }),
  deleteAnnouncement: (id: string) =>
    request<{ detail: string }>(`/api/admin/announcements/${id}`, { method: "DELETE" }),
  adminLogs: (level?: string) =>
    request<ActivityLog[]>(`/api/admin/logs${level ? `?level=${level}` : ""}`),
  adminSystemStatus: () => request<SystemStatus>("/api/admin/system-status"),
  adminDailyStats: (days = 30) => request<DailyStats>(`/api/admin/analytics/daily?days=${days}`),
  runCleanup: () => request<Record<string, number>>("/api/admin/cleanup/run", { method: "POST" }),
  printerReadiness: () =>
    request<{ status: string; registered_devices: number; registered_printers: number; message: string }>(
      "/api/admin/printers/readiness"
    ),
};
