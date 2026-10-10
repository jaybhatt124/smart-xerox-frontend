// Shared API types (mirror backend Pydantic schemas)

export type Role = "SUPER_ADMIN" | "SHOP_OWNER" | "CUSTOMER";
export type ApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type PrintStatus =
  | "SUBMITTED"
  | "ACCEPTED"
  | "AWAITING_PAYMENT_AT_SHOP"
  | "READY_FOR_MANUAL_PRINT"
  | "PRINTING_MANUALLY"
  | "PRINTED"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED"
  | "EXPIRED";
export type PaymentStatus = "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type ColorMode = "BW" | "COLOR";
export type PaperSize = "A4" | "A3" | "LETTER";
export type PrintSides = "SINGLE" | "DOUBLE";
export type Orientation = "AUTO" | "PORTRAIT" | "LANDSCAPE";
export type FittingMode = "FIT_TO_PAGE" | "ACTUAL_SIZE";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
  shop_id: string | null;
}

export interface Shop {
  id: string;
  owner_id: string;
  public_shop_id: string;
  shop_name: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  logo_url?: string | null;
  business_hours?: string | null;
  approval_status: ApprovalStatus;
  rejection_reason?: string | null;
  accepting_orders: boolean;
  created_at: string;
  owner_name?: string | null;
  owner_email?: string | null;
  total_orders?: number;
}

export interface ShopSettings {
  id: string;
  shop_id: string;
  max_file_size_mb: number;
  max_copies: number;
  default_paper_size: string;
  duplex_enabled: boolean;
  color_enabled: boolean;
  a3_enabled: boolean;
  letter_enabled: boolean;
  min_order_amount: number;
  handling_charge: number;
  order_expiry_minutes: number;
  document_retention_minutes: number;
  notification_sound: boolean;
  auto_print_enabled: boolean;
  require_payment_before_print: boolean;
}

export interface ShopDeviceSummary {
  device_id: string;
  device_name: string;
  platform: string;
  printer_name?: string | null;
  supports_color: boolean;
  supports_duplex: boolean;
  last_seen_at?: string | null;
  pairing_status: string;
  paired_at?: string | null;
  printers: { name: string; is_default: boolean }[];
}

export interface PublicShop {
  public_shop_id: string;
  shop_name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  logo_url?: string | null;
  business_hours?: string | null;
  accepting_orders: boolean;
  approval_status: ApprovalStatus;
  accepts_orders_now: boolean;
  services: PricingRule[];
  settings: {
    max_file_size_mb: number;
    max_copies: number;
    default_paper_size: string;
    duplex_enabled: boolean;
    order_expiry_minutes: number;
  };
}

export interface PricingRule {
  id: string;
  shop_id: string;
  paper_size: PaperSize;
  color_mode: ColorMode;
  price_per_page: number;
  is_enabled: boolean;
}

export interface PriceBreakdown {
  unit_price: number;
  selected_pages: number;
  copies: number;
  total_page_sides: number;
  estimated_sheets: number;
  handling_charge: number;
  subtotal: number;
  total_price: number;
  currency: string;
  meets_minimum: boolean;
  min_order_amount: number;
}

export interface DocumentMeta {
  upload_id: string;
  storage_key: string;
  original_filename: string;
  file_size: number;
  total_pages: number;
  preview_available: boolean;
  preview_url?: string | null;
  expires_in_seconds: number;
}

export interface JobEvent {
  id: string;
  event_type: string;
  actor_role?: string | null;
  old_status?: string | null;
  new_status?: string | null;
  event_metadata?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  shop_id: string;
  original_filename?: string | null;
  file_size?: number | null;
  document_deleted: boolean;
  total_document_pages: number;
  selected_page_count: number;
  selected_page_ranges?: string | null;
  estimated_sheets: number;
  copies: number;
  color_mode: ColorMode;
  paper_size: PaperSize;
  print_sides: PrintSides;
  orientation: Orientation;
  fitting_mode: FittingMode;
  customer_name?: string | null;
  customer_contact?: string | null;
  special_instructions?: string | null;
  unit_price: number;
  handling_charge: number;
  total_price: number;
  currency: string;
  price_snapshot?: string | null;
  payment_mode: string;
  payment_status: PaymentStatus;
  payment_recorded_at?: string | null;
  payment_note?: string | null;
  print_status: PrintStatus;
  expires_at?: string | null;
  printed_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  events?: JobEvent[];
}

export interface OrderCreated {
  id: string;
  order_number: string;
  tracking_token: string;
  tracking_url: string;
  total_price: number;
  currency: string;
  print_status: PrintStatus;
  payment_status: PaymentStatus;
  message: string;
}

export interface TrackOrder {
  order_number: string;
  shop_name: string;
  shop_public_id: string;
  shop_phone?: string | null;
  created_at: string;
  print_status: PrintStatus;
  payment_status: PaymentStatus;
  payment_mode: string;
  total_price: number;
  currency: string;
  document_deleted: boolean;
  document_available: boolean;
  copies: number;
  color_mode: ColorMode;
  paper_size: PaperSize;
  print_sides: PrintSides;
  selected_page_count: number;
  total_document_pages: number;
  special_instructions?: string | null;
  collection_instructions: string;
}

export interface OrderList {
  items: Order[];
  total: number;
  page: number;
  page_size: number;
}

export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface QRInfo {
  public_shop_id: string;
  print_url: string;
  qr_payload: string;
}

export interface Overview {
  orders_today: number;
  pending_orders: number;
  printed_orders: number;
  completed_orders: number;
  total_pages_requested: number;
  estimated_revenue: number;
  active_print_requests: number;
  average_order_value: number;
  currency: string;
  revenue_label: string;
}

export interface DailyPoint {
  date: string;
  orders: number;
  pages: number;
  revenue: number;
}

export interface DailyStats {
  points: DailyPoint[];
  total_orders: number;
  total_pages: number;
  total_revenue: number;
}

export interface PlatformStats {
  total_shops: number;
  pending_approvals: number;
  active_shops: number;
  suspended_shops: number;
  rejected_shops: number;
  total_print_orders: number;
  total_pages_requested: number;
  total_estimated_value: number;
  failed_orders: number;
  storage_objects: number;
  storage_bytes: number;
  currency: string;
}

export interface PlatformSettings {
  id: number;
  max_file_size_mb: number;
  allowed_file_types: string;
  default_order_expiry_minutes: number;
  default_document_retention_minutes: number;
  shop_registration_open: boolean;
  maintenance_mode: boolean;
  platform_name: string;
  support_email: string;
}

export interface Announcement {
  id: string;
  title: string;
  body?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id?: string | null;
  actor_role?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  level: string;
  detail?: string | null;
  created_at: string;
}

export interface SystemStatus {
  backend: string;
  database: string;
  storage: string;
  cleanup_worker: string;
  recent_errors: number;
  failed_jobs: number;
  pending_documents: number;
  maintenance_mode: boolean;
}
