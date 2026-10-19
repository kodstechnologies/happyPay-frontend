import { useEffect, Suspense } from "react";
import { useRoutes, useLocation } from "react-router-dom";
import Router from "./routes/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { registerForegroundNotificationHandler } from "./config/firebase";
import { AuthProvider } from "./context/AuthContext";
import HappyPayLoader from "./components/common/HappyPayLoader";

function App() {
  const routing = useRoutes(Router);
  const location = useLocation();

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
      toast.info(`${title}: ${body}`);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
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
    </AuthProvider>
  );
}

export default App;
