import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginAdmin } from "../../../services/api/admin/adminAuthApi";
import { saveAdminSession } from "../../../utils/adminAuth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await loginAdmin({
        email: email.trim(),
        password,
        rememberMe,
      });
      const user = response.user ?? response.admin;

      if (!response.accessToken) {
        throw new Error("The login response did not include an access token.");
      }

      saveAdminSession(response.accessToken, user);
      navigate("/admin/dashboard", { replace: true });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="hp-canvas flex min-h-screen items-center justify-center p-4 sm:p-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-[#172033] p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2">
                <img src="/happy-favicon.jpeg" alt="Happy Pay Logo" className="h-10 w-auto object-contain" />
              </div>
            </div>
            <p className="mt-16 max-w-sm text-4xl font-bold leading-tight text-white">
              Control the platform with clarity.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">
              Secure access for HappyPay platform operations and oversight.
            </p>
          </div>
          <p className="text-xs text-slate-400">HappyPay Super Admin Portal</p>
        </div>

        <div className="p-6 sm:p-10 lg:p-14">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="/happy-favicon.jpeg" alt="Happy Pay Logo" className="h-10 w-auto object-contain" />
          </div>

          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <div className="mb-5 flex items-center">
                <img src="/happy-favicon.jpeg" alt="Happy Pay Logo" className="h-12 w-auto object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Super Admin Portal
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to manage HappyPay platform operations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm outline-none focus:border-[#315bd1] focus:bg-white focus:ring-4 focus:ring-[#315bd1]/10"
                    placeholder="admin@happypay.in"
                    autoComplete="username"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-sm outline-none focus:border-[#315bd1] focus:bg-white focus:ring-4 focus:ring-[#315bd1]/10"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-[#315bd1]" />
                  Remember me
                </label>
                <Link to="/admin/forgot-password" className="text-sm font-semibold text-[#315bd1] hover:underline">Forgot password?</Link>
              </div>

              <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#315bd1] px-5 text-sm font-bold text-white transition hover:bg-[#274dbd] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Signing in..." : "Sign in to Admin Portal"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
