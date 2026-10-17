import { useNavigate } from "react-router-dom";
import { Clock3, LogOut } from "lucide-react";
import { logout } from "../../../utils/auth";

const RetailerKycPending = () => {
  const navigate = useNavigate();

  const handleApproval = () => {
    navigate("/retailer/kyc-approved", { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate("/retailer/login", { replace: true });
  };

  return (
    <div className="hp-retailer-canvas flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[24px] border border-white/80 bg-white p-8 text-center shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]">
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 ring-4 ring-amber-100">
            <Clock3 className="h-10 w-10 text-amber-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#172033]">
          KYC Verification Pending
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Your registration has been submitted successfully.
        </p>

        <p className="mt-2 text-sm text-slate-500 leading-6">
          Our admin team is reviewing your KYC details.
          You'll be notified once your account is approved.
        </p>

        <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs font-medium text-amber-700">
            Typical review time: 24–48 hours
          </p>
        </div>

        <button
          type="button"
          onClick={handleApproval}
          className="hp-brand mt-7 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(49,91,209,0.28)] transition hover:opacity-95 active:scale-[0.99]"
        >
          Simulate Admin Approval
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-rose-600 active:scale-[0.99]"
        >
          <LogOut className="h-4 w-4" />
          Logout & Exit
        </button>
      </div>
    </div>
  );
};

export default RetailerKycPending;


