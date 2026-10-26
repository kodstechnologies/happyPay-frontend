import { useEffect, Suspense } from "react";
import { useRoutes, useLocation, useNavigate } from "react-router-dom";
import Router from "./routes/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { registerForegroundNotificationHandler } from "./config/firebase";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import HappyPayLoader from "./components/common/HappyPayLoader";

function App() {
  const routing = useRoutes(Router);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      document.title = "HappyPay · Admin Portal";
    } else {
      document.title = "HappyPay · Retailer Portal";
    }
  }, [location.pathname]);

  // Listen for foreground FCM push notifications
  useEffect(() => {
    const unsubscribe = registerForegroundNotificationHandler((payload) => {
      const title = payload?.notification?.title || "New Notification";
      const body = payload?.notification?.body || "";
      const data = payload?.data || {};

      // Notify in-app components (Navbar, Notification pages) of new incoming alert
      window.dispatchEvent(new Event("hp:notification:update"));

      // Show toast notification
      toast.info(`${title}: ${body}`, {
        onClick: () => {
          // Handle navigation based on notification type
          const notificationType = data.type;
          const screen = data.screen;
          if (notificationType === "NEW_RETAILER_REGISTRATION" && screen === "ADMIN_RETAILERS") {
            navigate("/admin/retailers");
          } else if (notificationType === "KYC_APPROVED" && screen === "KYC") {
            navigate("/retailer/profile");
          } else if (notificationType === "KYC_REJECTED" && screen === "KYC") {
            navigate("/retailer/profile");
          } else if (notificationType === "REGISTRATION_SUCCESS") {
            navigate("/retailer");
          } else if (window.location.pathname.startsWith("/retailer")) {
            navigate("/retailer/notifications");
          } else if (window.location.pathname.startsWith("/admin")) {
            navigate("/admin/notifications");
          }
        },
      });

      console.log("Notification received:", payload);
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
        <Suspense
          fallback={
            <HappyPayLoader
              variant="fullscreen"
              message="Loading ..."
              subtitle="Preparing your HappyPay workspace"
            />
          }
        >
          {routing}
        </Suspense>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
