import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getAuthUser } from "../../../context/AuthContext";
import { getPendingStepIndex, getToken } from "../../../utils/auth";
import { Loader2 } from "lucide-react";

const RootRedirect: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    const effectiveUser = user || getAuthUser();
    const isAuthed = isAuthenticated || (!!getToken() && !!effectiveUser);

    if (!isAuthed || !effectiveUser) {
      navigate("/retailer/login", { replace: true });
      return;
    }

    const regStatus = String(effectiveUser.registrationStatus || "").toUpperCase();
    const currStep = String(effectiveUser.currentRegistrationStep || "").toUpperCase();
    const isRegistrationComplete = regStatus === "COMPLETED" || currStep === "SUBMITTED";

    if (!isRegistrationComplete) {
      const stepIndex = getPendingStepIndex(effectiveUser.currentRegistrationStep);
      navigate(`/retailer/register?step=${stepIndex}`, { replace: true });
      return;
    }

    const isApproved = String(effectiveUser.adminApproved || "").toLowerCase() === "approved";
    if (!isApproved) {
      navigate("/retailer/kyc-pending", { replace: true });
      return;
    }

    navigate("/retailer", { replace: true });
  }, [isLoading, isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white">
      <div className="relative flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6 animate-pulse">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">HappyPay</h2>
        <p className="text-sm text-slate-400 mt-1">Verifying your secure session...</p>
      </div>
    </div>
  );
};

export default RootRedirect;
