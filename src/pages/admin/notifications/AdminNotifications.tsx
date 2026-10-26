import { Bell, Check, Info, AlertTriangle, BellRing, Search, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "../../../apis/adminNotifications.apis";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications({ page: 1, limit: 50 });
      setNotifications(response.notifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const response = await getNotifications({ page: 1, limit: 50 });
        if (isMounted) {
          setNotifications(response.notifications);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(n => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const formatTime = (date: Date | string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getNotificationType = (type: string) => {
    if (type === "NEW_RETAILER_REGISTRATION") return "success";
    if (type === "KYC_APPROVED") return "success";
    if (type === "KYC_REJECTED") return "warning";
    return "info";
  };

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#315bd1]">
            System
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#171717]">
            <BellRing className="h-6 w-6 text-[#315bd1]" />
            Notifications
          </h1>
          <p className="mt-1 text-sm text-[#8992a3]">
            Manage and view recent system alerts and updates.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-[#315bd1] focus:outline-none focus:ring-2 focus:ring-[#315bd1]/20 sm:w-64 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={fetchNotifications}
            disabled={loading}
            className="flex h-9 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-[#315bd1] ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex h-9 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Check className="h-4 w-4 text-[#087f5b]" />
            Mark all read
          </button>
        </div>
      </section>

      {/* List */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 text-slate-300 animate-spin mb-4" />
            <h3 className="text-sm font-bold text-slate-900">Loading notifications...</h3>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => {
              const notificationType = getNotificationType(notification.type);
              return (
                <div
                  key={notification._id}
                  className={`flex gap-4 p-5 transition-colors hover:bg-slate-50 ${
                    !notification.isRead ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="mt-1 shrink-0">
                    {notificationType === "info" && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Info className="h-5 w-5" />
                      </div>
                    )}
                    {notificationType === "success" && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                    {notificationType === "warning" && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`text-sm font-bold ${!notification.isRead ? "text-slate-900" : "text-slate-700"}`}>
                          {notification.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">{notification.body}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-400">{formatTime(notification.createdAt)}</p>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="shrink-0 text-xs font-bold text-[#315bd1] hover:text-[#23429b] transition-colors"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
              <Bell className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No notifications found</h3>
            <p className="mt-1 text-sm text-slate-500">
              You're all caught up!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
