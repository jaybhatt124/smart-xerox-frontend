import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "@/pages/Landing";
import { Features, HowItWorks, PricingPage, Contact } from "@/pages/marketing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import PrintFlow from "@/pages/customer/PrintFlow";
import TrackOrderPage from "@/pages/customer/TrackOrder";
import Overview from "@/pages/dashboard/Overview";
import Orders from "@/pages/dashboard/Orders";
import OrderDetail from "@/pages/dashboard/OrderDetail";
import Pricing from "@/pages/dashboard/Pricing";
import QrCode from "@/pages/dashboard/QrCode";
import Analytics from "@/pages/dashboard/Analytics";
import ShopProfile from "@/pages/dashboard/ShopProfile";
import Settings from "@/pages/dashboard/Settings";
import Notifications from "@/pages/dashboard/Notifications";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminShops from "@/pages/admin/AdminShops";
import AdminShopDetail from "@/pages/admin/AdminShopDetail";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminLogs from "@/pages/admin/AdminLogs";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      {/* Public marketing + auth */}
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Customer (no login required) */}
      <Route path="/print/:shopId" element={<PrintFlow />} />
      <Route path="/order/:token" element={<TrackOrderPage />} />

      {/* Shop owner dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="SHOP_OWNER">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="pending" element={<Navigate to="/dashboard/orders?status=SUBMITTED,ACCEPTED,AWAITING_PAYMENT_AT_SHOP" replace />} />
        <Route path="completed" element={<Navigate to="/dashboard/orders?status=COMPLETED" replace />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="qr-code" element={<QrCode />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="shop" element={<ShopProfile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Super admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="SUPER_ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="shops" element={<AdminShops />} />
        <Route path="shops/:id" element={<AdminShopDetail />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
