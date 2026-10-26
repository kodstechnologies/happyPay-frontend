import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import HappyPayLoader from "../common/HappyPayLoader";

export default function AdminPublicRoute() {
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

  return isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Outlet />;
}

