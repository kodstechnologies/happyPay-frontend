import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, getAuthUser } from '../../context/AuthContext';
import { getToken } from '../../utils/auth';
import HappyPayLoader from '../common/HappyPayLoader';

const ProtectedRoutes = () => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <HappyPayLoader
                variant="fullscreen"
                message="Verifying Session..."
                subtitle="Authenticating with HappyPay secure gateway"
            />
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

    const isApproved = String(effectiveUser?.adminApproved || "").toLowerCase() === "approved";
    if (!isApproved) {
        return <Navigate to='/retailer/kyc-pending' replace />;
    }

    return <Outlet />;
};

export default ProtectedRoutes;