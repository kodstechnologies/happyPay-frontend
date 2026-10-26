import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/admin/AdminNavbar";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { updateAdminDeviceToken } from "../../apis/adminAuth.apis";
import { getFCMToken } from "../../config/firebase";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { logout: authLogout } = useAdminAuth();

  useEffect(() => {
    // Ensure active admin device has FCM token synchronized to DB
    let isMounted = true;
    (async () => {
      try {
        const token = await getFCMToken();
        if (token && isMounted) {
          const cachedToken = localStorage.getItem("adminFcmToken");
          let deviceId = localStorage.getItem("adminDeviceId");
          if (!deviceId) {
            deviceId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `admin-${Date.now()}`;
            localStorage.setItem("adminDeviceId", deviceId);
          }
          if (token !== cachedToken) {
            localStorage.setItem("adminFcmToken", token);
            await updateAdminDeviceToken({
              fcmToken: token,
              deviceId,
              platform: "web",
              deviceName: navigator.platform || "Web browser",
            });
          }
        }
      } catch (err) {
        console.warn("Could not sync admin FCM device token:", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const logout = async () => {
    await authLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="hp-canvas flex h-screen overflow-hidden text-[#0f172a]">
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={logout}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-3 pb-0 pt-3 sm:px-4 lg:px-6 lg:pt-4">
          <AdminNavbar onOpenMobile={() => setMobileOpen(true)} />
        </div>
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-4 lg:px-6 lg:py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
