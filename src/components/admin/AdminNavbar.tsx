import { Bell, ChevronDown, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getAdminUser } from "../../utils/adminAuth";
import { logoutAdmin } from "../../apis/adminAuth.apis";
import { getNotifications } from "../../apis/adminNotifications.apis";

const titles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/profile": "Admin Profile",
  "/admin/audit-logs": "Audit Logs",
};

export default function AdminNavbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const user = getAdminUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadUnreadCount = async () => {
      try {
        const response = await getNotifications({ unread: true, limit: 1 });
        if (isMounted) {
          setUnreadCount(response.total);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    loadUnreadCount();

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = async () => {
    await logoutAdmin();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/90 px-3 shadow-[0_10px_28px_-20px_rgba(15,23,42,0.45)] backdrop-blur-md sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Super Admin Portal
          </p>
          <h1 className="truncate text-base font-bold text-slate-900">
            {titles[location.pathname] ?? "Admin workspace"}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/admin/notifications")}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-left hover:bg-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dbe4ff] text-xs font-bold text-[#315bd1]">
              {user?.name?.slice(0, 2).toUpperCase() ?? "SA"}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-xs font-bold text-slate-900">
                {user?.name ?? "Super Admin"}
              </span>
              <span className="block text-[10px] text-slate-500">
                {user?.role ?? "Administrator"}
              </span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
          {open && (
            <div className="absolute right-0 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/admin/profile");
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                My Profile
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
