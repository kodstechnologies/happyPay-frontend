import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, getAuthUser } from '../../context/AuthContext';
import { getToken } from '../../utils/auth';
import { Loader2 } from 'lucide-react';

const ProtectedRoutes = () => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-sm text-slate-400">Verifying session...</p>
                </div>
            </div>
        );
    }

    const effectiveUser = user || getAuthUser();
    const isAuthed = isAuthenticated || (!!getToken() && !!effectiveUser);

    if (!isAuthed) {
        return <Navigate to='/retailer/login' replace />;
    }

    const isRegistrationComplete =
        String(effectiveUser?.registrationStatus || "").toUpperCase() === "COMPLETED" ||
        String(effectiveUser?.currentRegistrationStep || "").toUpperCase() === "SUBMITTED";

    if (effectiveUser && !isRegistrationComplete) {
        return <Navigate to='/retailer/login' replace />;
    }

    if (effectiveUser?.adminApproved && String(effectiveUser.adminApproved).toLowerCase() !== "approved") {
        return <Navigate to='/retailer/kyc-pending' replace />;
    }

    return <Outlet />;
};

export default ProtectedRoutes;