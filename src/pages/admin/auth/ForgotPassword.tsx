import { Mail, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../../apis/adminAuth.apis";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!email.trim()) {
      setError("Enter your admin email address.");
      return;
    }
    setLoading(true);
    try {
      const response = await forgotPassword({ email: email.trim() });
      setMessage(response.resetUrl ? `${response.message} ${response.resetUrl}` : (response.message ?? "If an account matches, reset instructions have been sent."));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to process the request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="hp-canvas flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-md rounded-[28px] border border-white bg-white p-6 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] sm:p-10">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#315bd1]">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Forgot password?</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter your admin email address and we will send reset instructions.
        </p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label htmlFor="forgot-email" className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm outline-none focus:border-[#315bd1] focus:bg-white focus:ring-4 focus:ring-[#315bd1]/10"
                placeholder="admin@happypay.in"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#315bd1] px-5 text-sm font-bold text-white hover:bg-[#274dbd] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset instructions"}
          </button>
          
          <p className="text-center text-sm text-slate-500">
            <Link to="/admin/login" className="font-semibold text-[#315bd1] hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
