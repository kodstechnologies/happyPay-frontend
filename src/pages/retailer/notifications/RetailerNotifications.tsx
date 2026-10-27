import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  AlertCircle,
  Search,
  Loader2,
  RefreshCw,
  Wallet,
  ShieldCheck,
  Filter,
} from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../../apis/notifications.apis";
import type { NotificationItem } from "../../../types/notification";
import {
  formatRelativeTime,
  getNotificationCategory,
} from "../../../utils/notifications";

export default function RetailerNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "transactions" | "kyc">("all");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchNotificationsList = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getNotifications({ page: 1, limit: 100 });
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error("Failed to fetch retailer notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getNotifications({ page: 1, limit: 100 })
      .then((response) => {
        if (isMounted) {
          setNotifications(response.notifications || []);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error("Failed to fetch retailer notifications:", error);
          setLoading(false);
        }
      });

    const handleRealtimeUpdate = () => {
      fetchNotificationsList(true);
    };

    window.addEventListener("hp:notification:update", handleRealtimeUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("hp:notification:update", handleRealtimeUpdate);
    };
  }, [fetchNotificationsList]);

  const handleMarkAsRead = async (id: string) => {
    try {
      setActionInProgress(id);
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date() } : n))
      );
      window.dispatchEvent(new Event("hp:notification:update"));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionInProgress("all");
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
      );
      window.dispatchEvent(new Event("hp:notification:update"));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    const screen = notification.data?.screen as string | undefined;
    const type = notification.type;

    if (screen === "KYC" || type === "KYC_APPROVED" || type === "KYC_REJECTED") {
      navigate("/retailer/profile");
    } else if (screen === "WALLET" || type === "WALLET_CREDIT" || type === "WALLET_DEBIT") {
      navigate("/retailer/wallet");
    } else if (type === "TRANSACTION_SUCCESS" || type === "TRANSACTION_FAILED") {
      navigate("/retailer/transactions");
    } else if (type === "SETTLEMENT") {
      navigate("/retailer/settlement/bank");
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === "unread" && n.isRead) return false;
      if (
        activeTab === "transactions" &&
        !n.type.includes("TRANSACTION") &&
        !n.type.includes("WALLET") &&
        !n.type.includes("COMMISSION")
      ) {
        return false;
      }
      if (
        activeTab === "kyc" &&
        !n.type.includes("KYC") &&
        !n.type.includes("REGISTRATION")
      ) {
        return false;
      }

      // Search filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        n.title.toLowerCase().includes(term) ||
        n.body.toLowerCase().includes(term) ||
        n.type.toLowerCase().includes(term)
      );
    });
  }, [notifications, activeTab, searchTerm]);

  const renderNotificationIcon = (type: string) => {
    const category = getNotificationCategory(type);
    if (type.includes("WALLET") || type.includes("COMMISSION")) {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7c3aed]">
          <Wallet className="h-5 w-5" />
        </div>
      );
    }

    if (type.includes("KYC") && category === "success") {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-5 w-5" />
        </div>
      );
    }

    switch (category) {
      case "success":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Check className="h-5 w-5" />
          </div>
        );
      case "danger":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <AlertCircle className="h-5 w-5" />
          </div>
        );
      case "warning":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
        );
      case "info":
      default:
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Info className="h-5 w-5" />
          </div>
        );
    }
  };

  return (
    <div className="mx-auto w-full space-y-5 p-2 sm:p-4">
      {/* HEADER SECTION */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7c3aed]">
            Retailer Notifications
          </p>
          <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-[#171717]">
            <BellRing className="h-6 w-6 text-[#7c3aed]" />
            Notifications & Alerts
          </h1>
          <p className="mt-1 text-sm text-[#8992a3]">
            Track your account alerts, KYC updates, wallet transactions, and services.
          </p>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchNotificationsList(true)}
            disabled={loading || refreshing}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#7c3aed] ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || actionInProgress === "all"}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Mark all read</span>
          </button>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_20px_-10px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
        {/* TAB BUTTONS */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "all"
                ? "bg-[#7c3aed] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("unread")}
            className={`relative rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "unread"
                ? "bg-[#7c3aed] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span
                className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  activeTab === "unread"
                    ? "bg-white text-[#7c3aed]"
                    : "bg-rose-500 text-white"
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "transactions"
                ? "bg-[#7c3aed] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Transactions
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("kyc")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "kyc"
                ? "bg-[#7c3aed] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            KYC & Account
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 transition focus:border-[#7c3aed] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/15"
          />
        </div>
      </section>

      {/* NOTIFICATIONS LIST CONTAINER */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#7c3aed]" />
            <h3 className="text-sm font-bold text-slate-900">Loading your notifications...</h3>
            <p className="mt-1 text-xs text-slate-400">Fetching latest alerts and messages</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => {
              const category = getNotificationCategory(notification.type);
              const isUnread = !notification.isRead;

              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group flex cursor-pointer items-start gap-3.5 p-4 transition-all duration-150 hover:bg-slate-50/90 sm:p-5 ${
                    isUnread
                      ? "border-l-4 border-l-[#7c3aed] bg-[#f8f5ff]/40"
                      : "border-l-4 border-l-transparent"
                  }`}
                >
                  {/* ICON */}
                  <div className="pt-0.5">{renderNotificationIcon(notification.type)}</div>

                  {/* CONTENT */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-sm tracking-tight ${
                            isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"
                          }`}
                        >
                          {notification.title}
                        </h3>

                        {isUnread && (
                          <span className="inline-flex items-center rounded-full bg-[#7c3aed]/10 px-2 py-0.5 text-[10px] font-bold text-[#7c3aed]">
                            New
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                            category === "success"
                              ? "bg-emerald-50 text-emerald-700"
                              : category === "danger"
                              ? "bg-rose-50 text-rose-700"
                              : category === "warning"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {notification.type.replace(/_/g, " ")}
                        </span>
                      </div>

                      <time className="shrink-0 text-xs font-medium text-slate-400">
                        {formatRelativeTime(notification.createdAt)}
                      </time>
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {notification.body}
                    </p>

                    {/* ACTION LINKS & ACTIONS */}
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      {/* {notification.data?.screen ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#7c3aed] transition group-hover:underline">
                          View details
                          <ArrowUpRight className="h-3 w-3" />
                        </span>
                      ) : (
                        <div />
                      )} */}

                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          disabled={actionInProgress === notification._id}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#7c3aed] transition hover:bg-[#7c3aed]/10"
                        >
                          <Check className="h-3 w-3" />
                          <span>Mark as read</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f8f5ff] text-[#7c3aed]">
              {searchTerm || activeTab !== "all" ? (
                <Filter className="h-8 w-8" />
              ) : (
                <Bell className="h-8 w-8" />
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900">
              {searchTerm || activeTab !== "all"
                ? "No matching notifications"
                : "No notifications yet"}
            </h3>

            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500 sm:text-sm">
              {searchTerm || activeTab !== "all"
                ? "Try adjusting your search keywords or switching filters to view other alerts."
                : "You're completely caught up! New KYC alerts, transaction reports, and system notices will appear here."}
            </p>

            {(searchTerm || activeTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setActiveTab("all");
                }}
                className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-[#7c3aed] shadow-sm transition hover:bg-slate-50"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
