import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { getNotifications } from "../apis/notifications.apis";

interface NavbarProps {
  onOpenSidebar?: () => void;
  UserName?: string | null;
}

const Navbar = ({ onOpenSidebar, UserName = "Retailer" }: NavbarProps) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const loadUnreadCount = useCallback(() => {
    getNotifications({ unread: true, limit: 1 })
      .then((response) => {
        setUnreadCount(response?.total || 0);
      })
      .catch((error) => {
        console.error("Failed to load retailer unread notifications:", error);
      });
  }, []);

  useEffect(() => {
    loadUnreadCount();

    const handleUpdate = () => {
      loadUnreadCount();
    };

    window.addEventListener("hp:notification:update", handleUpdate);
    return () => {
      window.removeEventListener("hp:notification:update", handleUpdate);
    };
  }, [loadUnreadCount]);

  return (
    <header className="hp-retailer-navbar flex h-16 items-center justify-between gap-3 rounded-[18px] border border-white/80 bg-white/95 px-3 shadow-[0_10px_28px_-20px_rgba(15,23,42,0.28)] backdrop-blur-md sm:px-4 lg:px-5">
      {/* LEFT */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-[#f8f5ff] hover:text-[#7c3aed] lg:hidden"
          aria-label="Open retailer navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a7aebc]">
              Retailer workspace
            </p>

            <p className="truncate text-sm font-bold tracking-tight text-[#171717]">
              HappyPay banking workspace
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex shrink-0 items-center gap-2">
        {/* LIVE STATUS */}

        {/* NOTIFICATIONS */}
        <button
          type="button"
          onClick={() => navigate("/retailer/notifications")}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-[#f8f5ff] hover:text-[#7c3aed]"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />

          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* RETAILER PROFILE */}
        <div className="ml-1 hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 pr-3 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f8f5ff] text-xs font-bold text-[#7c3aed]">
            HP
          </div>

          <div className="leading-tight">
            <p className="text-xs font-bold text-slate-900">
              {UserName}
            </p>

            <p className="text-[10px] font-medium text-slate-400">
              Retailer
            </p>
          </div>
        </div>



      </div>
    </header>
  );
};

export default Navbar;