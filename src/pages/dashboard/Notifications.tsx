import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellOff, Mail, MailOpen } from "lucide-react";
import { Button, Card, EmptyState, PageLoader, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatDate, titleCase } from "@/lib/utils";

const ICONS: Record<string, string> = {
  NEW_ORDER: "🖨️",
  ORDER_STATUS: "🚚",
  PAYMENT: "💰",
  SHOP_STATUS: "🏪",
  SYSTEM: "⚙️",
};

export default function Notifications() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: () => api.notifications() });
  const unread = useQuery({ queryKey: ["unread"], queryFn: api.unreadCount });

  const markAll = async () => {
    await api.markAllRead();
    toast.success("All notifications marked as read");
    void qc.invalidateQueries({ queryKey: ["notifications"] });
    void qc.invalidateQueries({ queryKey: ["unread"] });
  };

  const mark = async (id: string) => {
    await api.markRead(id);
    void qc.invalidateQueries({ queryKey: ["notifications"] });
    void qc.invalidateQueries({ queryKey: ["unread"] });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Notifications</h1>
          <p className="text-sm text-muted">{unread.data?.unread ?? 0} unread notification(s).</p>
        </div>
        <Button variant="outline" disabled={(unread.data?.unread ?? 0) === 0} onClick={markAll}>
          Mark all as read
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {data && data.length > 0 ? (
          <ul className="divide-y divide-line">
            {data.map((n) => (
              <li key={n.id} className={`flex items-start gap-3 px-5 py-4 ${!n.is_read ? "bg-blue-50/60" : "bg-white"}`}>
                <span className="text-xl">{ICONS[n.notification_type] ?? "🔔"}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{n.title}</p>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  {n.message && <p className="text-sm text-slate-600">{n.message}</p>}
                  <p className="mt-0.5 text-xs text-slate-400">
                    {titleCase(n.notification_type)} · {formatDate(n.created_at)}
                  </p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => mark(n.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-primary"
                    title="Mark as read"
                  >
                    <MailOpen className="h-4 w-4" />
                  </button>
                )}
                {n.is_read && <Mail className="h-4 w-4 text-slate-300" />}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={<BellOff className="h-8 w-8" />}
              title="No notifications"
              description="Order updates and system announcements will appear here."
            />
          </div>
        )}
      </Card>
    </div>
  );
}