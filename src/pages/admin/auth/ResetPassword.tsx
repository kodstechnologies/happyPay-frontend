import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../../apis/adminAuth.apis";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!token) return setError("This reset link is missing its token.");
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await resetPassword({ token, newPassword, confirmPassword });
      navigate("/admin/login", { replace: true, state: { message: "Password reset successfully. Sign in with your new password." } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="hp-canvas flex min-h-screen items-center justify-center p-4"><section className="w-full max-w-md rounded-[28px] border border-white bg-white p-6 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] sm:p-10"><div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#315bd1]"><ShieldCheck className="h-6 w-6" /></div><h1 className="text-2xl font-bold text-slate-900">Reset password</h1><p className="mt-2 text-sm leading-6 text-slate-500">Create a new password for your Super Admin account.</p><form onSubmit={handleSubmit} className="mt-7 space-y-5"><div><label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">New password</label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="new-password" type={showNew ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-sm outline-none focus:border-[#315bd1] focus:bg-white focus:ring-4 focus:ring-[#315bd1]/10" placeholder="At least 8 characters" /><button type="button" onClick={() => setShowNew((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400" aria-label="Toggle new password visibility">{showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div><div><label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="confirm-password" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-sm outline-none focus:border-[#315bd1] focus:bg-white focus:ring-4 focus:ring-[#315bd1]/10" placeholder="Repeat your password" /><button type="button" onClick={() => setShowConfirm((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400" aria-label="Toggle confirm password visibility">{showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>{error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}<button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#315bd1] px-5 text-sm font-bold text-white hover:bg-[#274dbd] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Resetting..." : "Reset password"}</button><p className="text-center text-sm text-slate-500"><Link to="/admin/login" className="font-semibold text-[#315bd1] hover:underline">Back to login</Link></p></form></section></main>;
}
