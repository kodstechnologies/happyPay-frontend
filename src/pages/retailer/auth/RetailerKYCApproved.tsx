import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight, ShieldCheck, LogOut } from "lucide-react";
import { logout } from "../../../utils/auth";

const RetailerKycApproved = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate("/retailer", { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate("/retailer/login", { replace: true });
  };

  return (
    <div className="hp-retailer-canvas flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[24px] border border-white/80 bg-white p-8 text-center shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
            <CheckCircle2 className="h-11 w-11 text-emerald-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#172033]">
          KYC Approved!
        </h1>

        <p className="mt-3 text-sm text-slate-500 leading-6">
          Congratulations! Your retailer KYC has been successfully
          verified and approved.
        </p>

        <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">
              Your account is now fully active
            </p>
          </div>
          <p className="mt-1 text-xs text-emerald-600">
            You can now access AEPS, DMT, CMS and all retailer services
          </p>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className="hp-brand mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(49,91,209,0.28)] transition hover:opacity-95 active:scale-[0.99]"
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-rose-600 active:scale-[0.99]"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default RetailerKycApproved;


