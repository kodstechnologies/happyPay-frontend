import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import HappyPayLoader from "../common/HappyPayLoader";

export default function AdminProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <HappyPayLoader
        variant="fullscreen"
        message="Verifying session..."
        subtitle="Securing your admin workspace"
      />
    );
  }

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  );
}

